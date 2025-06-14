// Nexus Engine Worker
// Web Worker implementation for running nexus calculations in the background

import { TransactionRow, EngineOptions, EngineResult } from './types';
import { analyzeNexus } from './index';

// Worker message types
interface WorkerMessage {
  type: 'ANALYZE_NEXUS';
  transactions: TransactionRow[];
  options: EngineOptions;
  requestId: string;
}

interface WorkerResponse {
  type: 'PROGRESS' | 'RESULT' | 'ERROR';
  requestId: string;
  data?: EngineResult;
  progress?: number;
  error?: string;
}

// Handle incoming messages
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, transactions, options, requestId } = event.data;
  
  try {
    if (type !== 'ANALYZE_NEXUS') {
      throw new Error(`Unknown message type: ${type}`);
    }
    
    // Report initial progress
    self.postMessage({
      type: 'PROGRESS',
      requestId,
      progress: 0
    } as WorkerResponse);
    
    // Validate input
    if (!transactions || !Array.isArray(transactions)) {
      throw new Error('Invalid transactions data');
    }
    
    if (!options || !options.mode) {
      throw new Error('Invalid options');
    }
    
    // Process transactions in batches to report progress
    const batchSize = 1000;
    const batches = Math.ceil(transactions.length / batchSize);
    const processedTransactions: TransactionRow[] = [];
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      
      // Convert string dates to Date objects
      const processedBatch = batch.map(row => ({
        ...row,
        date: row.date instanceof Date ? row.date : new Date(row.date)
      }));
      
      processedTransactions.push(...processedBatch);
      
      // Report progress
      const progress = Math.min(90, Math.round((i + batch.length) / transactions.length * 100));
      self.postMessage({
        type: 'PROGRESS',
        requestId,
        progress
      } as WorkerResponse);
      
      // Yield to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Run analysis
    const result = await analyzeNexus(processedTransactions, options);
    
    // Report completion
    self.postMessage({
      type: 'RESULT',
      requestId,
      data: result,
      progress: 100
    } as WorkerResponse);
    
  } catch (error) {
    // Report error
    self.postMessage({
      type: 'ERROR',
      requestId,
      error: error instanceof Error ? error.message : String(error)
    } as WorkerResponse);
  }
};

// Export type for TypeScript (not used in worker context)
export {};