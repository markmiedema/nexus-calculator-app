import { useCallback, useRef, useState } from 'react';

interface WorkerMessage {
  type: 'PROCESS_CSV' | 'PROGRESS' | 'SUCCESS' | 'ERROR';
  payload?: any;
  progress?: number;
  error?: string;
}

interface UseWebWorkerOptions {
  onProgress?: (progress: number) => void;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export const useWebWorker = (options: UseWebWorkerOptions = {}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const createWorker = useCallback(() => {
    // Create worker from embedded code
    const workerCode = `
      // This will be replaced with the actual worker code
      // For now, we'll use a URL-based approach
    `;

    try {
      // Try to create worker from URL first (for development)
      workerRef.current = new Worker(
        new URL('../workers/csvProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      // Fallback: create worker from blob (for production)
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      workerRef.current = new Worker(workerUrl);
    }

    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, payload, progress: workerProgress, error: workerError } = event.data;

      switch (type) {
        case 'PROGRESS':
          if (workerProgress !== undefined) {
            setProgress(workerProgress);
            options.onProgress?.(workerProgress);
          }
          break;

        case 'SUCCESS':
          setIsProcessing(false);
          setProgress(100);
          setError(null);
          options.onSuccess?.(payload);
          break;

        case 'ERROR':
          setIsProcessing(false);
          setProgress(0);
          const errorMessage = workerError || 'Unknown worker error';
          setError(errorMessage);
          options.onError?.(errorMessage);
          break;
      }
    };

    workerRef.current.onerror = (error) => {
      setIsProcessing(false);
      setProgress(0);
      const errorMessage = `Worker error: ${error.message || 'Unknown error'}`;
      setError(errorMessage);
      options.onError?.(errorMessage);
    };

    return workerRef.current;
  }, [options]);

  const processData = useCallback((data: any[]) => {
    if (!data || data.length === 0) {
      const errorMessage = 'No data provided for processing';
      setError(errorMessage);
      options.onError?.(errorMessage);
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const worker = workerRef.current || createWorker();

    worker.postMessage({
      type: 'PROCESS_CSV',
      payload: data
    } as WorkerMessage);
  }, [createWorker, options]);

  const terminateWorker = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsProcessing(false);
    setProgress(0);
    setError(null);
  }, []);

  const resetState = useCallback(() => {
    setIsProcessing(false);
    setProgress(0);
    setError(null);
  }, []);

  return {
    processData,
    terminateWorker,
    resetState,
    isProcessing,
    progress,
    error,
    isWorkerSupported: typeof Worker !== 'undefined'
  };
};