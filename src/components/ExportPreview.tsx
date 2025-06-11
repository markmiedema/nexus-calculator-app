import React from 'react';
import { ProcessedData } from '../types';
import { ExportConfig } from '../types/export';
import { 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  Shield,
  Eye,
  BarChart3,
  MapPin,
  CheckSquare,
  Database
} from 'lucide-react';

interface ExportPreviewProps {
  data: ProcessedData;
  config: ExportConfig;
  className?: string;
}

const ExportPreview: React.FC<ExportPreviewProps> = ({
  data,
  config,
  className = ''
}) => {
  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-6 w-6 text-green-600" />;
      case 'csv':
        return <FileText className="h-6 w-6 text-blue-600" />;
      case 'json':
        return <FileJson className="h-6 w-6 text-purple-600" />;
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-600" />;
      default:
        return <FileText className="h-6 w-6 text-gray-600" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case 'excel':
        return 'Multi-sheet Excel workbook with formatted data and charts';
      case 'csv':
        return 'Comma-separated values for data analysis and import';
      case 'json':
        return 'Machine-readable format for system integration';
      case 'pdf':
        return 'Professional report for presentations and documentation';
      default:
        return 'Data export';
    }
  };

  const calculateEstimatedSize = (): string => {
    let baseSize = 50; // Base size in KB
    
    if (config.includeSummary) baseSize += 10;
    if (config.includeStateAnalysis) baseSize += data.salesByState.length * 2;
    if (config.includeRecommendations) baseSize += 20;
    if (config.includeRawData) {
      const totalTransactions = data.salesByState.reduce((sum, state) => 
        sum + state.monthlyRevenue.length, 0);
      baseSize += totalTransactions * 0.5;
    }

    // Format multipliers
    if (config.format === 'excel') baseSize *= 1.5;
    if (config.format === 'pdf') baseSize *= 2;

    if (baseSize < 1024) return `${Math.round(baseSize)} KB`;
    return `${(baseSize / 1024).toFixed(1)} MB`;
  };

  const getIncludedSections = () => {
    const sections = [];
    if (config.includeSummary) sections.push({ name: 'Executive Summary', icon: BarChart3 });
    if (config.includeStateAnalysis) sections.push({ name: 'State Analysis', icon: MapPin });
    if (config.includeRecommendations) sections.push({ name: 'Recommendations', icon: CheckSquare });
    if (config.includeRawData) sections.push({ name: 'Raw Transaction Data', icon: Database });
    return sections;
  };

  const getExcelSheetPreview = () => {
    if (config.format !== 'excel') return null;

    const sheets = [];
    if (config.includeSummary) sheets.push('Executive Summary');
    if (config.includeStateAnalysis) sheets.push('State Analysis');
    if (data.nexusStates.length > 0) sheets.push('Nexus States');
    if (config.includeRecommendations) sheets.push('Recommendations');
    if (config.includeRawData && !config.sanitizeData) sheets.push('Raw Data');
    sheets.push('Export Info');

    return sheets;
  };

  const getDataSample = () => {
    if (config.sanitizeData) {
      return {
        totalStates: data.salesByState.length,
        nexusStates: data.nexusStates.length,
        analysisDate: data.dataRange.end,
        dataRedacted: true
      };
    }

    return {
      totalStates: data.salesByState.length,
      nexusStates: data.nexusStates.length,
      totalRevenue: data.salesByState.reduce((sum, state) => sum + state.totalRevenue, 0),
      totalLiability: data.totalLiability,
      analysisDate: data.dataRange.end
    };
  };

  const includedSections = getIncludedSections();
  const excelSheets = getExcelSheetPreview();
  const dataSample = getDataSample();

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-center mb-4">
        <div className="flex items-center">
          {getFormatIcon(config.format)}
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-800 capitalize">
              {config.format} Export Preview
            </h3>
            <p className="text-sm text-gray-600">
              {getFormatDescription(config.format)}
            </p>
          </div>
        </div>
        
        <div className="ml-auto text-right">
          <div className="text-lg font-bold text-gray-800">
            ~{calculateEstimatedSize()}
          </div>
          <div className="text-xs text-gray-500">Estimated size</div>
        </div>
      </div>

      {/* Content Overview */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Export Contents</h4>
        
        {includedSections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {includedSections.map((section, index) => (
              <div key={index} className="flex items-center p-3 bg-gray-50 rounded-md">
                <section.icon className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm text-gray-700">{section.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No content sections selected</p>
        )}
      </div>

      {/* Excel Sheets Preview */}
      {excelSheets && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Excel Worksheets</h4>
          <div className="flex flex-wrap gap-2">
            {excelSheets.map((sheet, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full"
              >
                {sheet}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Data Sample */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Data Overview</h4>
        <div className="bg-gray-50 rounded-md p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Analysis Period:</span>
              <div className="font-medium text-gray-800">
                {data.dataRange.start} to {data.dataRange.end}
              </div>
            </div>
            
            <div>
              <span className="text-gray-600">States Analyzed:</span>
              <div className="font-medium text-gray-800">{dataSample.totalStates}</div>
            </div>
            
            <div>
              <span className="text-gray-600">Nexus States:</span>
              <div className="font-medium text-gray-800">{dataSample.nexusStates}</div>
            </div>
            
            <div>
              <span className="text-gray-600">Total Liability:</span>
              <div className="font-medium text-gray-800">
                {dataSample.dataRedacted ? 'REDACTED' : `$${dataSample.totalLiability?.toLocaleString()}`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      {config.sanitizeData && (
        <div className="flex items-start p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <Shield className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Data Sanitization Enabled</p>
            <p className="text-xs text-yellow-700 mt-1">
              Sensitive financial data (revenue amounts, transaction counts) will be removed or 
              replaced with generic indicators. This export is safe for external sharing.
            </p>
          </div>
        </div>
      )}

      {/* Format-Specific Notes */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
        <div className="flex items-start">
          <Eye className="h-4 w-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-blue-800">Format Notes</p>
            <div className="text-xs text-blue-700 mt-1">
              {config.format === 'excel' && (
                <p>Excel export includes multiple worksheets, formatted tables, and metadata. Best for detailed analysis and presentations.</p>
              )}
              {config.format === 'csv' && (
                <p>CSV export provides structured data suitable for importing into spreadsheet applications or analysis tools.</p>
              )}
              {config.format === 'json' && (
                <p>JSON export offers machine-readable format perfect for system integration and automated processing.</p>
              )}
              {config.format === 'pdf' && (
                <p>PDF export creates a professional report with charts and formatted tables, ideal for presentations and documentation.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportPreview;