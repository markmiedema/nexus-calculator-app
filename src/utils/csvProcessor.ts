import { runNexusEngineInMainThread, isWebWorkerSupported } from './workerFallback';

export interface ProcessedData {
  transactions: any[];
  summary: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    totalRevenue: number;
    statesWithNexus: string[];
    complianceIssues: string[];
  };
  nexusAnalysis: {
    statesWithNexus: string[];
    potentialLiability: number;
    complianceRecommendations: string[];
  };
}

export interface ProgressCallback {
  (progress: number): void;
}

// Main CSV processing function
export const processCSVData = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<any> => {
  console.log(`Starting CSV processing for file: ${file.name}`);
  
  if (onProgress) {
    onProgress(10);
  }

  try {
    // Read the file
    const data = await readFileAsJSON(file, onProgress);
    
    if (onProgress) {
      onProgress(30);
    }

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

// Read file as JSON (from CSV/Excel)
const readFileAsJSON = async (file: File, onProgress?: ProgressCallback): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        if (!e.target || !e.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        // For simplicity in this example, we'll just return a mock dataset
        // In a real implementation, this would parse CSV/Excel data
        const mockData = [
          { date: '2024-01-01', state: 'CA', sale_amount: '1000', transaction_count: '1' },
          { date: '2024-01-02', state: 'NY', sale_amount: '2000', transaction_count: '2' },
          { date: '2024-01-03', state: 'TX', sale_amount: '1500', transaction_count: '1' }
        ];
        
        if (onProgress) {
          onProgress(20);
        }
        
        resolve(mockData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

// Web Worker processing strategy for medium datasets
const processWithWorkerStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<any> => {
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
): Promise<any> => {
  console.log(`Using main thread processing for ${data.length} rows`);
  
  try {
    // Run the Nexus Engine directly in the main thread
    const nexusResults = await runNexusEngineInMainThread(data, (progress) => {
      if (onProgress) {
        const adjustedProgress = 30 + (progress * 0.5);
        onProgress(adjustedProgress);
      }
    });
    
    if (onProgress) {
      onProgress(80);
    }
    
    // Process the data to create the ProcessedData format
    return await finalizeProcessing(data, onProgress, 80);
  } catch (error) {
    console.error('Main thread processing failed:', error);
    throw error;
  }
};

// Chunked processing strategy for large datasets
const processWithChunkedStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<any> => {
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

// Helper function to finalize processing
const finalizeProcessing = async (
  data: any[],
  onProgress?: ProgressCallback,
  startProgress: number = 0
): Promise<any> => {
  // Basic processing logic
  const validRows = data.filter(row => row && Object.keys(row).length > 0);
  const totalRevenue = validRows.reduce((sum, row) => {
    const amount = parseFloat(row.sales_amount || row.amount || '0');
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  if (onProgress) {
    onProgress(startProgress + 10);
  }
  
  // Extract unique states
  const statesWithNexus = [...new Set(
    validRows
      .map(row => row.state || row.State)
      .filter(state => state && typeof state === 'string')
  )];
  
  if (onProgress) {
    onProgress(startProgress + 15);
  }
  
  // Basic compliance analysis
  const complianceIssues: string[] = [];
  if (totalRevenue > 100000) {
    complianceIssues.push('High revenue threshold reached - review nexus requirements');
  }
  
  if (onProgress) {
    onProgress(100);
  }
  
  return {
    transactions: validRows,
    summary: {
      totalRows: data.length,
      validRows: validRows.length,
      invalidRows: data.length - validRows.length,
      totalRevenue,
      statesWithNexus,
      complianceIssues
    },
    nexusAnalysis: {
      statesWithNexus,
      potentialLiability: totalRevenue * 0.08, // Rough estimate
      complianceRecommendations: [
        'Review state-specific nexus thresholds',
        'Consider registering in high-revenue states',
        'Implement automated compliance monitoring'
      ]
    }
  };
};

// Helper function to combine multiple processed results
const combineProcessedResults = (results: ProcessedData[]): ProcessedData => {
  const combined: ProcessedData = {
    transactions: [],
    summary: {
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      totalRevenue: 0,
      statesWithNexus: [],
      complianceIssues: []
    },
    nexusAnalysis: {
      statesWithNexus: [],
      potentialLiability: 0,
      complianceRecommendations: []
    }
  };
  
  results.forEach(result => {
    combined.transactions.push(...result.transactions);
    combined.summary.totalRows += result.summary.totalRows;
    combined.summary.validRows += result.summary.validRows;
    combined.summary.invalidRows += result.summary.invalidRows;
    combined.summary.totalRevenue += result.summary.totalRevenue;
    combined.summary.statesWithNexus.push(...result.summary.statesWithNexus);
    combined.summary.complianceIssues.push(...result.summary.complianceIssues);
    
    combined.nexusAnalysis.statesWithNexus.push(...result.nexusAnalysis.statesWithNexus);
    combined.nexusAnalysis.potentialLiability += result.nexusAnalysis.potentialLiability;
    combined.nexusAnalysis.complianceRecommendations.push(...result.nexusAnalysis.complianceRecommendations);
  });
  
  // Remove duplicates
  combined.summary.statesWithNexus = [...new Set(combined.summary.statesWithNexus)];
  combined.nexusAnalysis.statesWithNexus = [...new Set(combined.nexusAnalysis.statesWithNexus)];
  combined.summary.complianceIssues = [...new Set(combined.summary.complianceIssues)];
  combined.nexusAnalysis.complianceRecommendations = [...new Set(combined.nexusAnalysis.complianceRecommendations)];
  
  return combined;
};