// Export system types
export interface ExportConfig {
  format: 'json' | 'csv' | 'excel' | 'pdf';
  includeRawData: boolean;
  includeSummary: boolean;
  includeStateAnalysis: boolean;
  includeRecommendations: boolean;
  sanitizeData: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  selectedStates?: string[];
  customFields?: string[];
}

export interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  config: ExportConfig;
  instructions: string[];
  useCase: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  size: number;
  format: string;
  downloadUrl?: string;
  error?: string;
}

export interface SanitizedData {
  nexusStates: any[];
  salesByState: any[];
  summary: {
    totalStates: number;
    totalRevenue: number;
    totalLiability: number;
    analysisDate: string;
  };
  metadata: {
    exportDate: string;
    exportConfig: ExportConfig;
    version: string;
  };
}