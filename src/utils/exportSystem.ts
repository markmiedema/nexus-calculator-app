import * as XLSX from 'xlsx';
import { ProcessedData } from '../types';
import { ExportConfig, ExportResult, SanitizedData, ExportTemplate } from '../types/export';
import { generatePDF } from './pdf-generator';

// Export templates for different use cases
export const EXPORT_TEMPLATES: ExportTemplate[] = [
  {
    id: 'full-analysis',
    name: 'Complete Analysis Report',
    description: 'Full analysis including all data, recommendations, and state details',
    config: {
      format: 'excel',
      includeRawData: true,
      includeSummary: true,
      includeStateAnalysis: true,
      includeRecommendations: true,
      sanitizeData: false
    },
    instructions: [
      'Contains all analysis data and recommendations',
      'Suitable for internal review and compliance planning',
      'Includes sensitive financial data - handle securely'
    ],
    useCase: 'Internal compliance review and planning'
  },
  {
    id: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level summary for executive review',
    config: {
      format: 'pdf',
      includeRawData: false,
      includeSummary: true,
      includeStateAnalysis: false,
      includeRecommendations: true,
      sanitizeData: true
    },
    instructions: [
      'Executive-level overview of nexus obligations',
      'Sanitized data suitable for sharing',
      'Focus on key findings and recommendations'
    ],
    useCase: 'Executive presentations and board meetings'
  },
  {
    id: 'compliance-data',
    name: 'Compliance Data Export',
    description: 'Structured data for compliance systems',
    config: {
      format: 'json',
      includeRawData: true,
      includeSummary: true,
      includeStateAnalysis: true,
      includeRecommendations: false,
      sanitizeData: false
    },
    instructions: [
      'Machine-readable format for system integration',
      'Contains detailed state-by-state analysis',
      'Suitable for importing into compliance software'
    ],
    useCase: 'System integration and automated compliance'
  },
  {
    id: 'audit-package',
    name: 'Audit Documentation',
    description: 'Complete documentation package for audits',
    config: {
      format: 'excel',
      includeRawData: true,
      includeSummary: true,
      includeStateAnalysis: true,
      includeRecommendations: true,
      sanitizeData: false
    },
    instructions: [
      'Comprehensive documentation for audit purposes',
      'Includes all supporting data and calculations',
      'Formatted for auditor review and verification'
    ],
    useCase: 'Tax audits and regulatory compliance'
  },
  {
    id: 'state-registration',
    name: 'State Registration Data',
    description: 'Data formatted for state registration processes',
    config: {
      format: 'csv',
      includeRawData: false,
      includeSummary: false,
      includeStateAnalysis: true,
      includeRecommendations: false,
      sanitizeData: true
    },
    instructions: [
      'State-specific data for registration applications',
      'Includes nexus dates and revenue thresholds',
      'Formatted for state tax authority submissions'
    ],
    useCase: 'State tax registration applications'
  }
];

// Main export function
export const exportData = async (
  data: ProcessedData,
  config: ExportConfig
): Promise<ExportResult> => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `salt-nexus-analysis-${timestamp}`;
    
    let result: ExportResult;

    switch (config.format) {
      case 'json':
        result = await exportToJSON(data, config, baseFilename);
        break;
      case 'csv':
        result = await exportToCSV(data, config, baseFilename);
        break;
      case 'excel':
        result = await exportToExcel(data, config, baseFilename);
        break;
      case 'pdf':
        result = await exportToPDF(data, config, baseFilename);
        break;
      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }

    return result;
  } catch (error) {
    return {
      success: false,
      filename: '',
      size: 0,
      format: config.format,
      error: error instanceof Error ? error.message : 'Unknown export error'
    };
  }
};

// JSON Export
const exportToJSON = async (
  data: ProcessedData,
  config: ExportConfig,
  baseFilename: string
): Promise<ExportResult> => {
  const exportData = prepareExportData(data, config);
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  const filename = `${baseFilename}.json`;
  downloadBlob(blob, filename);
  
  return {
    success: true,
    filename,
    size: blob.size,
    format: 'json'
  };
};

// CSV Export
const exportToCSV = async (
  data: ProcessedData,
  config: ExportConfig,
  baseFilename: string
): Promise<ExportResult> => {
  let csvContent = '';
  
  if (config.includeSummary) {
    csvContent += generateSummaryCSV(data);
    csvContent += '\n\n';
  }
  
  if (config.includeStateAnalysis) {
    csvContent += generateStateAnalysisCSV(data, config);
    csvContent += '\n\n';
  }
  
  if (config.includeRawData && !config.sanitizeData) {
    csvContent += generateRawDataCSV(data);
  }
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${baseFilename}.csv`;
  downloadBlob(blob, filename);
  
  return {
    success: true,
    filename,
    size: blob.size,
    format: 'csv'
  };
};

// Excel Export
const exportToExcel = async (
  data: ProcessedData,
  config: ExportConfig,
  baseFilename: string
): Promise<ExportResult> => {
  const workbook = XLSX.utils.book_new();
  
  // Summary Sheet
  if (config.includeSummary) {
    const summaryData = generateSummaryData(data);
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Executive Summary');
  }
  
  // State Analysis Sheet
  if (config.includeStateAnalysis) {
    const stateData = generateStateAnalysisData(data, config);
    const stateSheet = XLSX.utils.json_to_sheet(stateData);
    XLSX.utils.book_append_sheet(workbook, stateSheet, 'State Analysis');
  }
  
  // Nexus States Sheet
  if (data.nexusStates.length > 0) {
    const nexusData = data.nexusStates.map(state => ({
      'State': state.name,
      'State Code': state.code,
      'Nexus Date': state.nexusDate,
      'Total Revenue': state.totalRevenue,
      'Transaction Count': state.transactionCount,
      'Threshold Triggered': state.thresholdTriggered,
      'Revenue Threshold': state.revenueThreshold,
      'Transaction Threshold': state.transactionThreshold || 'N/A',
      'Registration Deadline': state.registrationDeadline,
      'Filing Frequency': state.filingFrequency,
      'Tax Rate (%)': state.taxRate,
      'Estimated Liability': state.liability
    }));
    const nexusSheet = XLSX.utils.json_to_sheet(nexusData);
    XLSX.utils.book_append_sheet(workbook, nexusSheet, 'Nexus States');
  }
  
  // Raw Data Sheet (if requested and not sanitized)
  if (config.includeRawData && !config.sanitizeData) {
    const rawData = generateRawDataForExcel(data);
    if (rawData.length > 0) {
      const rawSheet = XLSX.utils.json_to_sheet(rawData);
      XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw Data');
    }
  }
  
  // Recommendations Sheet
  if (config.includeRecommendations) {
    const recommendationsData = generateRecommendationsData(data);
    const recommendationsSheet = XLSX.utils.json_to_sheet(recommendationsData);
    XLSX.utils.book_append_sheet(workbook, recommendationsSheet, 'Recommendations');
  }
  
  // Export configuration sheet
  const configData = [
    { 'Setting': 'Export Date', 'Value': new Date().toISOString() },
    { 'Setting': 'Format', 'Value': config.format },
    { 'Setting': 'Include Raw Data', 'Value': config.includeRawData ? 'Yes' : 'No' },
    { 'Setting': 'Include Summary', 'Value': config.includeSummary ? 'Yes' : 'No' },
    { 'Setting': 'Include State Analysis', 'Value': config.includeStateAnalysis ? 'Yes' : 'No' },
    { 'Setting': 'Include Recommendations', 'Value': config.includeRecommendations ? 'Yes' : 'No' },
    { 'Setting': 'Data Sanitized', 'Value': config.sanitizeData ? 'Yes' : 'No' },
    { 'Setting': 'Analysis Period', 'Value': `${data.dataRange.start} to ${data.dataRange.end}` }
  ];
  const configSheet = XLSX.utils.json_to_sheet(configData);
  XLSX.utils.book_append_sheet(workbook, configSheet, 'Export Info');
  
  // Generate and download
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const filename = `${baseFilename}.xlsx`;
  downloadBlob(blob, filename);
  
  return {
    success: true,
    filename,
    size: blob.size,
    format: 'excel'
  };
};

// PDF Export
const exportToPDF = async (
  data: ProcessedData,
  config: ExportConfig,
  baseFilename: string
): Promise<ExportResult> => {
  try {
    await generatePDF(data);
    
    return {
      success: true,
      filename: `${baseFilename}.pdf`,
      size: 0, // PDF size not easily calculable
      format: 'pdf'
    };
  } catch (error) {
    throw new Error(`PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper functions for data preparation
const prepareExportData = (data: ProcessedData, config: ExportConfig): SanitizedData => {
  const exportData: SanitizedData = {
    nexusStates: config.sanitizeData ? sanitizeNexusStates(data.nexusStates) : data.nexusStates,
    salesByState: config.sanitizeData ? sanitizeSalesByState(data.salesByState) : data.salesByState,
    summary: {
      totalStates: data.salesByState.length,
      totalRevenue: data.salesByState.reduce((sum, state) => sum + state.totalRevenue, 0),
      totalLiability: data.totalLiability,
      analysisDate: data.dataRange.end
    },
    metadata: {
      exportDate: new Date().toISOString(),
      exportConfig: config,
      version: '1.0.0'
    }
  };
  
  return exportData;
};

const sanitizeNexusStates = (nexusStates: any[]) => {
  return nexusStates.map(state => ({
    code: state.code,
    name: state.name,
    nexusDate: state.nexusDate,
    thresholdTriggered: state.thresholdTriggered,
    registrationDeadline: state.registrationDeadline,
    filingFrequency: state.filingFrequency,
    taxRate: state.taxRate,
    // Remove sensitive financial data
    hasNexus: true,
    complianceRequired: true
  }));
};

const sanitizeSalesByState = (salesByState: any[]) => {
  return salesByState.map(state => ({
    code: state.code,
    name: state.name,
    thresholdProximity: state.thresholdProximity,
    revenueThreshold: state.revenueThreshold,
    transactionThreshold: state.transactionThreshold,
    taxRate: state.taxRate,
    // Remove actual revenue and transaction data
    hasActivity: state.totalRevenue > 0,
    approachingThreshold: state.thresholdProximity > 75
  }));
};

const generateSummaryCSV = (data: ProcessedData): string => {
  const summary = [
    ['Metric', 'Value'],
    ['Analysis Date', new Date().toLocaleDateString()],
    ['Analysis Period', `${data.dataRange.start} to ${data.dataRange.end}`],
    ['Total States with Sales', data.salesByState.length.toString()],
    ['States with Nexus', data.nexusStates.length.toString()],
    ['Total Estimated Liability', `$${data.totalLiability.toLocaleString()}`],
    ['Priority States', data.priorityStates.length.toString()]
  ];
  
  return summary.map(row => row.join(',')).join('\n');
};

const generateStateAnalysisCSV = (data: ProcessedData, config: ExportConfig): string => {
  const headers = ['State', 'State Code', 'Total Revenue', 'Transaction Count', 'Threshold Proximity (%)', 'Tax Rate (%)', 'Has Nexus'];
  
  const rows = data.salesByState.map(state => [
    state.name,
    state.code,
    config.sanitizeData ? 'REDACTED' : state.totalRevenue.toString(),
    config.sanitizeData ? 'REDACTED' : state.transactionCount.toString(),
    state.thresholdProximity.toString(),
    state.taxRate.toString(),
    data.nexusStates.some(n => n.code === state.code) ? 'Yes' : 'No'
  ]);
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const generateRawDataCSV = (data: ProcessedData): string => {
  // This would include the original transaction data if available
  // For now, we'll include monthly revenue data
  const headers = ['State', 'Month', 'Revenue', 'Transactions'];
  const rows: string[][] = [];
  
  data.salesByState.forEach(state => {
    state.monthlyRevenue.forEach(month => {
      rows.push([
        state.name,
        month.date,
        month.revenue.toString(),
        month.transactions.toString()
      ]);
    });
  });
  
  return [headers, ...rows].map(row => row.join(',')).join('\n');
};

const generateSummaryData = (data: ProcessedData) => {
  return [
    { 'Metric': 'Analysis Date', 'Value': new Date().toLocaleDateString() },
    { 'Metric': 'Analysis Period', 'Value': `${data.dataRange.start} to ${data.dataRange.end}` },
    { 'Metric': 'Total States with Sales', 'Value': data.salesByState.length },
    { 'Metric': 'States with Nexus', 'Value': data.nexusStates.length },
    { 'Metric': 'Total Estimated Liability', 'Value': data.totalLiability },
    { 'Metric': 'Priority States', 'Value': data.priorityStates.length },
    { 'Metric': 'Available Years', 'Value': data.availableYears.join(', ') }
  ];
};

const generateStateAnalysisData = (data: ProcessedData, config: ExportConfig) => {
  return data.salesByState.map(state => ({
    'State': state.name,
    'State Code': state.code,
    'Total Revenue': config.sanitizeData ? 'REDACTED' : state.totalRevenue,
    'Transaction Count': config.sanitizeData ? 'REDACTED' : state.transactionCount,
    'Revenue Threshold': state.revenueThreshold,
    'Transaction Threshold': state.transactionThreshold || 'N/A',
    'Threshold Proximity (%)': state.thresholdProximity,
    'Tax Rate (%)': state.taxRate,
    'Has Nexus': data.nexusStates.some(n => n.code === state.code) ? 'Yes' : 'No'
  }));
};

const generateRawDataForExcel = (data: ProcessedData) => {
  const rawData: any[] = [];
  
  data.salesByState.forEach(state => {
    state.monthlyRevenue.forEach(month => {
      rawData.push({
        'State': state.name,
        'State Code': state.code,
        'Month': month.date,
        'Revenue': month.revenue,
        'Transactions': month.transactions
      });
    });
  });
  
  return rawData;
};

const generateRecommendationsData = (data: ProcessedData) => {
  const recommendations = [];
  
  if (data.nexusStates.length > 0) {
    recommendations.push(
      { 'Priority': 'High', 'Action': 'Register for sales tax permits in nexus states', 'Timeline': 'Immediate' },
      { 'Priority': 'High', 'Action': 'Calculate exact tax liabilities', 'Timeline': '30 days' },
      { 'Priority': 'Medium', 'Action': 'Implement tax collection systems', 'Timeline': '60 days' },
      { 'Priority': 'Medium', 'Action': 'Establish filing calendars', 'Timeline': '90 days' },
      { 'Priority': 'Low', 'Action': 'Monitor threshold changes', 'Timeline': 'Ongoing' }
    );
  } else {
    recommendations.push(
      { 'Priority': 'Medium', 'Action': 'Continue monitoring sales by state', 'Timeline': 'Monthly' },
      { 'Priority': 'Low', 'Action': 'Set up threshold alerts', 'Timeline': '30 days' },
      { 'Priority': 'Low', 'Action': 'Review nexus thresholds quarterly', 'Timeline': 'Quarterly' }
    );
  }
  
  return recommendations;
};

// Utility function to download blob
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export template management
export const getExportTemplate = (templateId: string): ExportTemplate | undefined => {
  return EXPORT_TEMPLATES.find(template => template.id === templateId);
};

export const createCustomTemplate = (
  name: string,
  description: string,
  config: ExportConfig,
  instructions: string[],
  useCase: string
): ExportTemplate => {
  return {
    id: `custom-${Date.now()}`,
    name,
    description,
    config,
    instructions,
    useCase
  };
};