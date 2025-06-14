import { runNexusEngineInMainThread, isWebWorkerSupported } from './workerFallback';
import { ProcessedData } from '../types';
import { analyzeNexus } from './nexusEngine';
import { convertToProcessedData } from './nexusEngine/integration';
import { TransactionRow, EngineOptions } from './nexusEngine/types';

export interface ProgressCallback {
  (progress: number): void;
}

// Main CSV processing function
export const processCSVData = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  console.log(`Starting CSV processing for ${data.length} rows`);
  
  if (onProgress) {
    onProgress(10);
  }

  try {
    // Determine processing strategy based on data size
    if (data.length < 1000) {
      return await processWithMainThreadStrategy(data, onProgress);
    } else if (data.length < 10000) {
      return await processWithWorkerStrategy(data, onProgress);
    } else {
      return await processWithChunkedStrategy(data, onProgress);
    }
  } catch (error) {
    console.error('CSV processing failed:', error);
    throw error;
  }
};

// Web Worker processing strategy for medium datasets
const processWithWorkerStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  console.log(`Using Web Worker processing for ${data.length} rows`);
  
  // Check if Web Workers are supported
  if (!isWebWorkerSupported()) {
    console.log('Web Workers not supported, falling back to main thread processing');
    return await processWithMainThreadStrategy(data, onProgress);
  }
  
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/csvProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      const { type, payload, progress, error } = event.data;

      switch (type) {
        case 'PROGRESS':
          if (onProgress && progress !== undefined) {
            const adjustedProgress = 30 + (progress * 0.7);
            onProgress(adjustedProgress);
          }
          break;

        case 'SUCCESS':
          worker.terminate();
          resolve(payload);
          break;

        case 'ERROR':
          worker.terminate();
          reject(new Error(error || 'Worker processing failed'));
          break;
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };

    worker.postMessage({
      type: 'PROCESS_CSV',
      payload: data
    });
  });
};

// Main thread processing strategy for small datasets
const processWithMainThreadStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  console.log(`Using main thread processing for ${data.length} rows`);
  
  try {
    if (onProgress) {
      onProgress(30);
    }

    // Map the data to the format expected by the Nexus Engine
    const mappedTransactions: TransactionRow[] = data.map((row, index) => ({
      id: row.id || `tx-${index}`,
      state_code: normalizeStateCode(row.state || row.state_code || row.State),
      amount: parseFloat(row.sale_amount || row.sales_amount || row.amount || row.total || '0'),
      date: parseDate(row.date || row.transaction_date || row.sale_date || row.order_date),
      revenue_type: mapRevenueType(row.revenue_type)
    })).filter(tx => tx.state_code && !isNaN(tx.amount) && tx.amount > 0);

    if (onProgress) {
      onProgress(50);
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
    console.error('Main thread processing failed:', error);
    throw error;
  }
};

// Chunked processing strategy for large datasets
const processWithChunkedStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  console.log(`Using chunked processing for ${data.length} rows`);
  
  const chunkSize = 1000;
  const chunks = [];
  
  // Split data into chunks
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  
  const results: ProcessedData[] = [];
  
  // Process each chunk
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkResult = await processWithMainThreadStrategy(chunk, (chunkProgress) => {
      if (onProgress) {
        const overallProgress = ((i / chunks.length) * 100) + ((chunkProgress / chunks.length));
        onProgress(overallProgress);
      }
    });
    
    results.push(chunkResult);
  }
  
  // Combine results
  return combineProcessedResults(results);
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

// Helper function to combine multiple processed results
const combineProcessedResults = (results: ProcessedData[]): ProcessedData => {
  if (results.length === 0) {
    // Return a default empty ProcessedData structure
    return {
      nexusStates: [],
      totalLiability: 0,
      priorityStates: [],
      salesByState: [],
      dataRange: {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      availableYears: [new Date().getFullYear().toString()]
    };
  }

  if (results.length === 1) {
    return results[0];
  }

  // Combine multiple results
  const combined: ProcessedData = {
    nexusStates: [],
    totalLiability: 0,
    priorityStates: [],
    salesByState: [],
    dataRange: {
      start: results[0].dataRange.start,
      end: results[0].dataRange.end
    },
    availableYears: []
  };
  
  // Combine nexus states
  const stateMap = new Map();
  results.forEach(result => {
    result.nexusStates.forEach(state => {
      if (stateMap.has(state.code)) {
        const existing = stateMap.get(state.code);
        existing.totalRevenue += state.totalRevenue;
        existing.transactionCount += state.transactionCount;
        existing.liability += state.liability;
      } else {
        stateMap.set(state.code, { ...state });
      }
    });
  });
  
  combined.nexusStates = Array.from(stateMap.values());
  combined.totalLiability = combined.nexusStates.reduce((sum, state) => sum + state.liability, 0);
  combined.priorityStates = [...combined.nexusStates].sort((a, b) => b.liability - a.liability);
  
  // Combine sales by state
  const salesMap = new Map();
  results.forEach(result => {
    result.salesByState.forEach(state => {
      if (salesMap.has(state.code)) {
        const existing = salesMap.get(state.code);
        existing.totalRevenue += state.totalRevenue;
        existing.transactionCount += state.transactionCount;
      } else {
        salesMap.set(state.code, { ...state });
      }
    });
  });
  
  combined.salesByState = Array.from(salesMap.values());
  
  // Combine available years
  const yearsSet = new Set<string>();
  results.forEach(result => {
    result.availableYears.forEach(year => yearsSet.add(year));
  });
  combined.availableYears = Array.from(yearsSet).sort();
  
  // Update date range
  const startDates = results.map(r => r.dataRange.start).sort();
  const endDates = results.map(r => r.dataRange.end).sort();
  combined.dataRange.start = startDates[0];
  combined.dataRange.end = endDates[endDates.length - 1];
  
  return combined;
};