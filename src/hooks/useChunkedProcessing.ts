import { useState, useCallback, useRef } from 'react';
import {
  processDataInChunks,
  ChunkProgress,
  ProcessingStats,
  calculateOptimalChunkSize
} from '../utils/chunkProcessor';

interface UseChunkedProcessingOptions {
  onProgress?: (progress: ChunkProgress) => void;
  onChunkComplete?: (result: any, chunkIndex: number) => void;
  onComplete?: (results: any[]) => void;
  onError?: (error: string) => void;
  customChunkSize?: number;
  forceSequential?: boolean;
}

export const useChunkedProcessing = (options: UseChunkedProcessingOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<ChunkProgress | null>(null);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any[] | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const startTimeRef = useRef<number>(0);
  const processedRowsRef = useRef<number>(0);

  const processData = useCallback(async <T, R>(
    data: T[],
    processor: (chunk: T[], chunkIndex: number) => Promise<R>
  ) => {
    if (isProcessing) {
      throw new Error('Processing already in progress');
    }

    setIsProcessing(true);
    setProgress(null);
    setStats(null);
    setError(null);
    setResults(null);
    startTimeRef.current = Date.now();
    processedRowsRef.current = 0;

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      // Calculate optimal configuration
      const config = calculateOptimalChunkSize(data.length);
      console.log('Chunked processing configuration:', config);

      const chunkResults: R[] = [];
      let completedChunks = 0;

      const results = await processDataInChunks(
        data,
        processor,
        {
          customChunkSize: options.customChunkSize,
          forceSequential: options.forceSequential,
          onProgress: (chunkProgress) => {
            setProgress(chunkProgress);
            
            // Update processing stats
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTimeRef.current;
            const throughput = processedRowsRef.current / (elapsedTime / 1000);
            
            const currentStats: ProcessingStats = {
              totalRows: data.length,
              processedRows: processedRowsRef.current,
              chunksCompleted: completedChunks,
              totalChunks: chunkProgress.totalChunks,
              averageChunkTime: chunkProgress.processingTime / Math.max(1, completedChunks),
              throughputRowsPerSecond: throughput,
              memoryUsage: getMemoryUsage()
            };
            
            setStats(currentStats);
            options.onProgress?.(chunkProgress);
          },
          onChunkComplete: (result, chunkIndex) => {
            chunkResults.push(result);
            completedChunks++;
            
            // Estimate processed rows (this would be more accurate with actual row counts from chunks)
            processedRowsRef.current = Math.floor((completedChunks / progress?.totalChunks || 1) * data.length);
            
            options.onChunkComplete?.(result, chunkIndex);
          }
        }
      );

      setResults(results);
      setIsProcessing(false);
      options.onComplete?.(results);
      
      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsProcessing(false);
      options.onError?.(errorMessage);
      throw err;
    } finally {
      abortControllerRef.current = null;
    }
  }, [isProcessing, options]);

  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
      setError('Processing cancelled by user');
    }
  }, []);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(null);
    setStats(null);
    setError(null);
    setResults(null);
    processedRowsRef.current = 0;
  }, []);

  const getProcessingInfo = useCallback(() => {
    if (!progress) return null;

    return {
      isProcessing,
      progress,
      stats,
      error,
      results,
      canCancel: isProcessing && abortControllerRef.current !== null,
      estimatedCompletion: progress.estimatedTimeRemaining > 0 
        ? new Date(Date.now() + progress.estimatedTimeRemaining)
        : null
    };
  }, [isProcessing, progress, stats, error, results]);

  return {
    processData,
    cancelProcessing,
    resetState,
    getProcessingInfo,
    isProcessing,
    progress,
    stats,
    error,
    results
  };
};

// Utility function to get memory usage
const getMemoryUsage = (): number => {
  if ('memory' in performance && 'usedJSHeapSize' in (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};