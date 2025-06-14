// Update the processWithWorkerStrategy function to handle the case when Web Workers are not available
// Around line 150-180 in the file

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

// Add a new function for main thread processing
const processWithMainThreadStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
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

// Import the new function at the top of the file
import { runNexusEngineInMainThread, isWebWorkerSupported } from './workerFallback';