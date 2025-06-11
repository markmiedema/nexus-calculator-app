import React, { useState, useEffect } from 'react';
import { ProcessedData } from '../types';
import { ExportConfig, ExportTemplate, ExportResult } from '../types/export';
import { exportData, EXPORT_TEMPLATES, getExportTemplate } from '../utils/exportSystem';
import { 
  X, 
  Download, 
  Eye, 
  Settings, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  Shield,
  Clock,
  CheckCircle,
  AlertCircle,
  Share2,
  Copy,
  ExternalLink
} from 'lucide-react';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: ProcessedData;
  onExportComplete: (result: ExportResult) => void;
}

const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
  onExportComplete
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('full-analysis');
  const [customConfig, setCustomConfig] = useState<ExportConfig>({
    format: 'excel',
    includeRawData: true,
    includeSummary: true,
    includeStateAnalysis: true,
    includeRecommendations: true,
    sanitizeData: false
  });
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [useCustomConfig, setUseCustomConfig] = useState(false);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-5 w-5 text-green-600" />;
      case 'csv':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'json':
        return <FileJson className="h-5 w-5 text-purple-600" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const config = useCustomConfig 
        ? customConfig 
        : getExportTemplate(selectedTemplate)?.config || customConfig;

      const result = await exportData(data, config);
      setExportResult(result);
      onExportComplete(result);
    } catch (error) {
      setExportResult({
        success: false,
        filename: '',
        size: 0,
        format: customConfig.format,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generatePreviewData = () => {
    const config = useCustomConfig 
      ? customConfig 
      : getExportTemplate(selectedTemplate)?.config || customConfig;

    const estimatedSize = calculateEstimatedSize(data, config);
    const includedSections = [];
    
    if (config.includeSummary) includedSections.push('Executive Summary');
    if (config.includeStateAnalysis) includedSections.push('State Analysis');
    if (config.includeRecommendations) includedSections.push('Recommendations');
    if (config.includeRawData) includedSections.push('Raw Transaction Data');

    return {
      format: config.format,
      estimatedSize,
      includedSections,
      sanitized: config.sanitizeData,
      stateCount: data.salesByState.length,
      nexusStateCount: data.nexusStates.length
    };
  };

  const calculateEstimatedSize = (data: ProcessedData, config: ExportConfig): string => {
    let baseSize = 50; // Base size in KB
    
    if (config.includeSummary) baseSize += 10;
    if (config.includeStateAnalysis) baseSize += data.salesByState.length * 2;
    if (config.includeRecommendations) baseSize += 20;
    if (config.includeRawData) {
      const totalTransactions = data.salesByState.reduce((sum, state) => 
        sum + state.monthlyRevenue.length, 0);
      baseSize += totalTransactions * 0.5;
    }

    if (config.format === 'excel') baseSize *= 1.5;
    if (config.format === 'pdf') baseSize *= 2;

    if (baseSize < 1024) return `${Math.round(baseSize)} KB`;
    return `${(baseSize / 1024).toFixed(1)} MB`;
  };

  if (!isOpen) return null;

  const previewData = generatePreviewData();
  const selectedTemplateData = getExportTemplate(selectedTemplate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Export Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose your export format and configuration
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Template Selection */}
          <div className="w-1/2 p-6 border-r border-gray-200 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Export Templates</h3>
                <button
                  onClick={() => setUseCustomConfig(!useCustomConfig)}
                  className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-colors ${
                    useCustomConfig
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Settings className="h-4 w-4 mr-1" />
                  Custom
                </button>
              </div>

              {!useCustomConfig ? (
                <div className="space-y-3">
                  {EXPORT_TEMPLATES.map((template) => (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          {getFormatIcon(template.config.format)}
                          <h4 className="font-medium text-gray-800 ml-2">{template.name}</h4>
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                          {template.config.format}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      
                      <div className="text-xs text-gray-500">
                        <strong>Use case:</strong> {template.useCase}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Custom Configuration Form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Export Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['excel', 'csv', 'json', 'pdf'].map((format) => (
                        <button
                          key={format}
                          onClick={() => setCustomConfig({ ...customConfig, format: format as any })}
                          className={`flex items-center p-3 border rounded-md transition-colors ${
                            customConfig.format === format
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {getFormatIcon(format)}
                          <span className="ml-2 text-sm capitalize">{format}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Include Content
                    </label>
                    <div className="space-y-2">
                      {[
                        { key: 'includeSummary', label: 'Executive Summary' },
                        { key: 'includeStateAnalysis', label: 'State Analysis' },
                        { key: 'includeRecommendations', label: 'Recommendations' },
                        { key: 'includeRawData', label: 'Raw Transaction Data' }
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={customConfig[key as keyof ExportConfig] as boolean}
                            onChange={(e) => setCustomConfig({
                              ...customConfig,
                              [key]: e.target.checked
                            })}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">{label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        checked={customConfig.sanitizeData}
                        onChange={(e) => setCustomConfig({
                          ...customConfig,
                          sanitizeData: e.target.checked
                        })}
                        className="mr-2 mt-1"
                      />
                      <div>
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 text-yellow-600 mr-1" />
                          <span className="text-sm font-medium text-yellow-800">
                            Sanitize sensitive data
                          </span>
                        </div>
                        <p className="text-xs text-yellow-700 mt-1">
                          Remove specific revenue amounts and transaction counts for external sharing
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Preview and Actions */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-800">Export Preview</h3>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {showPreview ? 'Hide' : 'Show'} Details
                </button>
              </div>

              {/* Preview Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  {getFormatIcon(previewData.format)}
                  <span className="ml-2 font-medium text-gray-800 capitalize">
                    {previewData.format} Export
                  </span>
                  <span className="ml-auto text-sm text-gray-500">
                    ~{previewData.estimatedSize}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                  <div>
                    <span className="text-gray-600">States:</span>
                    <span className="ml-2 font-medium">{previewData.stateCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Nexus States:</span>
                    <span className="ml-2 font-medium">{previewData.nexusStateCount}</span>
                  </div>
                </div>

                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700">Included Sections:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {previewData.includedSections.map((section) => (
                      <span
                        key={section}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded"
                      >
                        {section}
                      </span>
                    ))}
                  </div>
                </div>

                {previewData.sanitized && (
                  <div className="flex items-center text-sm text-yellow-700 bg-yellow-100 px-2 py-1 rounded">
                    <Shield className="h-4 w-4 mr-1" />
                    Data sanitized for external sharing
                  </div>
                )}
              </div>

              {/* Detailed Preview */}
              {showPreview && (
                <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">Export Contents</h4>
                  
                  {!useCustomConfig && selectedTemplateData && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Instructions:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {selectedTemplateData.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-gray-400 mr-2">•</span>
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Analysis Period:</span>
                      <span className="font-medium">
                        {data.dataRange.start} to {data.dataRange.end}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Liability:</span>
                      <span className="font-medium">
                        {previewData.sanitized ? 'REDACTED' : `$${data.totalLiability.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Export Date:</span>
                      <span className="font-medium">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Result */}
              {exportResult && (
                <div className={`p-4 rounded-lg border mb-6 ${
                  exportResult.success 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center">
                    {exportResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <div className="flex-grow">
                      <p className={`font-medium ${
                        exportResult.success ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {exportResult.success ? 'Export Successful' : 'Export Failed'}
                      </p>
                      {exportResult.success ? (
                        <p className="text-sm text-green-700 mt-1">
                          Downloaded: {exportResult.filename} ({(exportResult.size / 1024).toFixed(1)} KB)
                        </p>
                      ) : (
                        <p className="text-sm text-red-700 mt-1">
                          {exportResult.error}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Sharing Recommendations */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-2">
                  <Share2 className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-medium text-blue-800">Sharing Recommendations</h4>
                </div>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Use <strong>sanitized exports</strong> when sharing with external parties</p>
                  <p>• <strong>Excel format</strong> is best for detailed analysis and presentations</p>
                  <p>• <strong>PDF format</strong> is ideal for executive summaries and reports</p>
                  <p>• <strong>JSON format</strong> works well for system integration</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            Export will be downloaded automatically
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportDialog;