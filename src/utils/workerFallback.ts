// Fallback processing for environments without Web Worker support
import { ProcessedData } from '../types';
import { processCSVData as originalProcessCSVData } from './csvProcessor';
import { analyzeNexus } from './nexusEngine';
import { TransactionRow, EngineOptions } from './nexusEngine/types';

export const processCSVDataFallback = async (
  data: any[],
  onProgress?: (progress: number) => void
): Promise<ProcessedData> => {
  // Use the original CSV processor as fallback
  // This will run on the main thread but with progress callbacks
  
  if (onProgress) {
    onProgress(0);
  }

  try {
    // Simulate the worker's progress reporting
    const progressInterval = setInterval(() => {
      // This is a simple simulation - in reality the original processor
      // would need to be modified to support progress callbacks
      if (onProgress) {
        const currentProgress = Math.min(90, Math.random() * 100);
        onProgress(currentProgress);
      }
    }, 100);

    // Create a mock file for the original processor
    const csvContent = convertDataToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'data.csv', { type: 'text/csv' });

    // Process the data using the original processor
    const processedData = await originalProcessCSVData(file, onProgress);
    
    // Run the Nexus Engine on the processed data
    const mappedTransactions: TransactionRow[] = [];
    
    // Map the processed data to the format expected by the Nexus Engine
    processedData.salesByState.forEach(state => {
      state.monthlyRevenue.forEach(month => {
        mappedTransactions.push({
          id: `${state.code}-${month.date}`,
          state_code: state.code,
          amount: month.revenue,
          date: new Date(month.date),
          revenue_type: 'taxable' // Default to taxable
        });
      });
    });
    
    // Run the Nexus Engine analysis
    const engineOptions: EngineOptions = {
      mode: 'multiYearEstimate',
      yearRange: [
        parseInt(processedData.dataRange.start.substring(0, 4)),
        parseInt(processedData.dataRange.end.substring(0, 4))
      ],
      ignoreMarketplace: false,
      includeNegativeAmounts: false
    };
    
    const nexusResults = await analyzeNexus(mappedTransactions, engineOptions);
    
    // We could use the nexusResults to enhance the processedData here if needed
    // For now, we'll just return the original processed data
    
    clearInterval(progressInterval);
    
    if (onProgress) {
      onProgress(100);
    }

    return processedData;
  } catch (error) {
    throw new Error(`Fallback processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const convertDataToCSV = (data: any[]): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
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
      state_code: row.state || row.state_code,
      amount: parseFloat(row.sale_amount || row.amount || 0),
      date: new Date(row.date || row.transaction_date),
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