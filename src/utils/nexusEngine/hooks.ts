// Nexus Engine Hooks
// React hooks for using the Nexus Engine in React components

import { useState, useCallback, useEffect } from 'react';
import { TransactionRow, EngineOptions, EngineResult } from './types';
import { analyzeNexus } from './index';

/**
 * Hook for using the Nexus Engine directly in a component
 */
export function useNexusEngine() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const analyze = useCallback(async (
    transactions: TransactionRow[],
    options: EngineOptions
  ) => {
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setError(null);
    
    try {
      // Process in batches to update progress
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
        
        // Update progress
        const currentProgress = Math.min(90, Math.round((i + batch.length) / transactions.length * 100));
        setProgress(currentProgress);
        
        // Yield to prevent blocking UI
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      // Run analysis
      const analysisResult = await analyzeNexus(processedTransactions, options);
      setResult(analysisResult);
      setProgress(100);
      
      return analysisResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  return {
    analyze,
    isProcessing,
    progress,
    result,
    error,
    reset: useCallback(() => {
      setIsProcessing(false);
      setProgress(0);
      setResult(null);
      setError(null);
    }, [])
  };
}

/**
 * Hook for using the Nexus Engine with Web Workers
 */
export function useNexusEngineWorker() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  
  // Initialize worker
  useEffect(() => {
    if (typeof Worker === 'undefined') {
      return;
    }
    
    try {
      const newWorker = new Worker(
        new URL('./worker.ts', import.meta.url),
        { type: 'module' }
      );
      
      setWorker(newWorker);
      
      return () => {
        newWorker.terminate();
      };
    } catch (err) {
      console.error('Failed to initialize Web Worker:', err);
    }
  }, []);
  
  // Handle worker messages
  useEffect(() => {
    if (!worker) return;
    
    const handleMessage = (event: MessageEvent) => {
      const { type, requestId: msgRequestId, data, progress: msgProgress, error: msgError } = event.data;
      
      // Ignore messages for other requests
      if (msgRequestId !== requestId) return;
      
      switch (type) {
        case 'PROGRESS':
          setProgress(msgProgress || 0);
          break;
          
        case 'RESULT':
          setResult(data);
          setProgress(100);
          setIsProcessing(false);
          setRequestId(null);
          break;
          
        case 'ERROR':
          setError(msgError || 'Unknown error');
          setIsProcessing(false);
          setRequestId(null);
          break;
      }
    };
    
    worker.addEventListener('message', handleMessage);
    
    return () => {
      worker.removeEventListener('message', handleMessage);
    };
  }, [worker, requestId]);
  
  const analyze = useCallback(async (
    transactions: TransactionRow[],
    options: EngineOptions
  ) => {
    if (!worker) {
      throw new Error('Web Worker not available');
    }
    
    setIsProcessing(true);
    setProgress(0);
    setResult(null);
    setError(null);
    
    // Generate unique request ID
    const newRequestId = `nexus-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setRequestId(newRequestId);
    
    return new Promise<EngineResult>((resolve, reject) => {
      // Set up one-time listeners for this specific request
      const handleResult = (event: MessageEvent) => {
        const { type, requestId: msgRequestId, data, error: msgError } = event.data;
        
        if (msgRequestId !== newRequestId) return;
        
        if (type === 'RESULT') {
          worker.removeEventListener('message', handleResult);
          resolve(data);
        } else if (type === 'ERROR') {
          worker.removeEventListener('message', handleResult);
          reject(new Error(msgError || 'Unknown error'));
        }
      };
      
      worker.addEventListener('message', handleResult);
      
      // Send request to worker
      worker.postMessage({
        type: 'ANALYZE_NEXUS',
        transactions,
        options,
        requestId: newRequestId
      });
    });
  }, [worker]);
  
  return {
    analyze,
    isProcessing,
    progress,
    result,
    error,
    isWorkerAvailable: !!worker,
    reset: useCallback(() => {
      setIsProcessing(false);
      setProgress(0);
      setResult(null);
      setError(null);
      setRequestId(null);
    }, [])
  };
}