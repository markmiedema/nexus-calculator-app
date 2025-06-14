// Fallback processing for environments without Web Worker support
import { ProcessedData } from '../types';
import { analyzeNexus } from './nexusEngine';
import { convertToProcessedData } from './nexusEngine/integration';
import { TransactionRow, EngineOptions } from './nexusEngine/types';

export const processCSVDataFallback = async (
  data: any[],
  onProgress?: (progress: number) => void
): Promise<ProcessedData> => {
  if (onProgress) {
    onProgress(0);
  }

  try {
    // Map the data to the format expected by the Nexus Engine
    const mappedTransactions: TransactionRow[] = data.map((row, index) => ({
      id: row.id || `tx-${index}`,
      state_code: normalizeStateCode(row.state || row.state_code || row.State),
      amount: parseFloat(row.sale_amount || row.sales_amount || row.amount || row.total || '0'),
      date: parseDate(row.date || row.transaction_date || row.sale_date || row.order_date),
      revenue_type: mapRevenueType(row.revenue_type)
    })).filter(tx => tx.state_code && !isNaN(tx.amount) && tx.amount > 0);

    if (onProgress) {
      onProgress(30);
    }
    
    // Run the Nexus Engine analysis
    const engineOptions: EngineOptions = {
      mode: 'multiYearEstimate',
      yearRange: [
        new Date().getFullYear() - 3,
        new Date().getFullYear()
      ],
      ignoreMarketplace: false,
      includeNegativeAmounts: false
    };
    
    const nexusResults = await analyzeNexus(mappedTransactions, engineOptions);
    
    if (onProgress) {
      onProgress(80);
    }
    
    // Convert the engine results to ProcessedData format
    const processedData = convertToProcessedData(nexusResults);
    
    if (onProgress) {
      onProgress(100);
    }

    return processedData;
  } catch (error) {
    throw new Error(`Fallback processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper function to normalize state codes
const normalizeStateCode = (state?: string): string => {
  if (!state) return '';
  
  const stateStr = state.toString().trim().toUpperCase();
  
  // If it's already a 2-letter code, return it
  if (stateStr.length === 2) {
    return stateStr;
  }
  
  // Map full state names to codes (simplified version)
  const stateMap: Record<string, string> = {
    'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
    'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
    'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
    'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
    'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
    'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC'
  };
  
  return stateMap[stateStr] || stateStr.substring(0, 2);
};

// Helper function to parse dates
const parseDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? new Date() : date;
};

export const isWebWorkerSupported = (): boolean => {
  return typeof Worker !== 'undefined' && typeof window !== 'undefined';
};

// New function to run Nexus Engine directly in main thread
export const runNexusEngineInMainThread = async (
  data: any[],
  onProgress?: (progress: number) => void
): Promise<any> => {
  if (onProgress) {
    onProgress(0);
  }
  
  try {
    // Map the data to the format expected by the Nexus Engine
    const mappedTransactions: TransactionRow[] = data.map((row, index) => ({
      id: row.id || `tx-${index}`,
      state_code: normalizeStateCode(row.state || row.state_code),
      amount: parseFloat(row.sale_amount || row.amount || 0),
      date: parseDate(row.date || row.transaction_date),
      revenue_type: mapRevenueType(row.revenue_type)
    }));
    
    if (onProgress) {
      onProgress(30);
    }
    
    // Run the Nexus Engine analysis
    const engineOptions: EngineOptions = {
      mode: 'multiYearEstimate',
      yearRange: [
        new Date().getFullYear() - 3,
        new Date().getFullYear()
      ],
      ignoreMarketplace: false,
      includeNegativeAmounts: false
    };
    
    const nexusResults = await analyzeNexus(mappedTransactions, engineOptions);
    
    if (onProgress) {
      onProgress(100);
    }
    
    return nexusResults;
  } catch (error) {
    throw new Error(`Main thread Nexus Engine processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Helper to map revenue types
const mapRevenueType = (type?: string): TransactionRow['revenue_type'] | undefined => {
  if (!type) return undefined;
  
  const lowerType = type.toLowerCase();
  
  if (lowerType.includes('marketplace') || lowerType === 'mf') {
    return 'marketplace';
  }
  
  if (lowerType.includes('non') || lowerType === 'exempt' || lowerType === 'non-taxable') {
    return 'nontaxable';
  }
  
  if (lowerType === 'taxable' || lowerType === 'tax') {
    return 'taxable';
  }
  
  return undefined;
};