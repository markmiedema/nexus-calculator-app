import React, { useState } from 'react';
import { ProcessedData } from '../types';
import { ExportConfig, ExportTemplate } from '../types/export';
import { exportData, EXPORT_TEMPLATES, getExportTemplate } from '../utils/exportSystem';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson, 
  Settings, 
  Eye, 
  EyeOff, 
  Calendar,
  Shield,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

interface ExportSystemProps {
  data: ProcessedData;
  className?: string;
}

const ExportSystem: React.FC<ExportSystemProps> = ({ data, className = '' }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('full-analysis');
  const [customConfig, setCustomConfig] = useState<ExportConfig>({
    format: 'excel',
    includeRawData: true,
    includeSummary: true,
    includeStateAnalysis: true,
    includeRecommendations: true,
    sanitizeData: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [showCustomConfig, setShowCustomConfig] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);

  const handleTemplateExport = async (templateId: string) => {
    const template = getExportTemplate(templateId);
    if (!template) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      const result = await exportData(data, template.config);
      setExportResult(result);
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleCustomExport = async () => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const result = await exportData(data, customConfig);
      setExportResult(result);
    } catch (error) {
      setExportResult({
        success: false,
        error: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

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

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'excel':
        return 'Multi-sheet Excel workbook with formatted data';
      case 'csv':
        return 'Comma-separated values for data analysis';
      case 'json':
        return 'Machine-readable format for system integration';
      case 'pdf':
        return 'Professional report for presentations';
      default:
        return 'Data export';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Export Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">
              Export your SALT nexus analysis in multiple formats
            </p>
          </div>
          <button
            onClick={() => setShowCustomConfig(!showCustomConfig)}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            <Settings className="h-4 w-4 mr-2" />
            Custom Export
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Export Templates */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Export Templates</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {EXPORT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    {getFormatIcon(template.config.format)}
                    <h4 className="font-medium text-gray-800 ml-2">{template.name}</h4>
                  </div>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                    {template.config.format}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Use Case:</p>
                  <p className="text-xs text-gray-600">{template.useCase}</p>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-2">Includes:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.config.includeSummary && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Summary</span>
                    )}
                    {template.config.includeStateAnalysis && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">States</span>
                    )}
                    {template.config.includeRecommendations && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Recommendations</span>
                    )}
                    {template.config.includeRawData && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">Raw Data</span>
                    )}
                    {template.config.sanitizeData && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                        <Shield className="h-3 w-3 inline mr-1" />
                        Sanitized
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => handleTemplateExport(template.id)}
                  disabled={isExporting}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Custom Export Configuration */}
        {showCustomConfig && (
          <div className="border border-gray-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Export Configuration</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                <div className="space-y-2">
                  {['excel', 'csv', 'json', 'pdf'].map((format) => (
                    <label key={format} className="flex items-center">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={customConfig.format === format}
                        onChange={(e) => setCustomConfig({ ...customConfig, format: e.target.value as any })}
                        className="mr-2"
                      />
                      <div className="flex items-center">
                        {getFormatIcon(format)}
                        <span className="ml-2 text-sm text-gray-700 capitalize">{format}</span>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {getFormatDescription(customConfig.format)}
                </p>
              </div>

              {/* Content Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include Content</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customConfig.includeSummary}
                      onChange={(e) => setCustomConfig({ ...customConfig, includeSummary: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Executive Summary</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customConfig.includeStateAnalysis}
                      onChange={(e) => setCustomConfig({ ...customConfig, includeStateAnalysis: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">State-by-State Analysis</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customConfig.includeRecommendations}
                      onChange={(e) => setCustomConfig({ ...customConfig, includeRecommendations: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Compliance Recommendations</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={customConfig.includeRawData}
                      onChange={(e) => setCustomConfig({ ...customConfig, includeRawData: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Raw Transaction Data</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Security Options */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 text-yellow-600 mr-2" />
                <h4 className="font-medium text-yellow-800">Data Security Options</h4>
              </div>
              
              <label className="flex items-start">
                <input
                  type="checkbox"
                  checked={customConfig.sanitizeData}
                  onChange={(e) => setCustomConfig({ ...customConfig, sanitizeData: e.target.checked })}
                  className="mr-2 mt-1"
                />
                <div>
                  <span className="text-sm font-medium text-yellow-800">Sanitize sensitive data</span>
                  <p className="text-xs text-yellow-700 mt-1">
                    Remove specific revenue amounts and transaction counts. Recommended for external sharing.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleCustomExport}
                disabled={isExporting}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Custom'}
              </button>
            </div>
          </div>
        )}

        {/* Export Result */}
        {exportResult && (
          <div className={`p-4 rounded-lg border ${
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
              <div>
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

        {/* Export Instructions */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Export Guidelines</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Excel format</strong> provides the most comprehensive analysis with multiple worksheets</li>
                <li>• <strong>CSV format</strong> is ideal for importing into other analysis tools</li>
                <li>• <strong>JSON format</strong> is perfect for system integration and automated processing</li>
                <li>• <strong>PDF format</strong> creates professional reports for presentations and documentation</li>
                <li>• Use <strong>sanitized exports</strong> when sharing data externally to protect sensitive information</li>
                <li>• All exports include metadata about the analysis configuration and export settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportSystem;