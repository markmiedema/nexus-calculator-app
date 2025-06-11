// Chunked Processing Utilities
// Optimal chunk size calculation and processing pipeline

export interface ChunkConfig {
  optimalSize: number;
  maxChunks: number;
  processingMethod: 'sequential' | 'parallel';
  workerPoolSize: number;
}

export interface ChunkProgress {
  chunkIndex: number;
  totalChunks: number;
  chunkProgress: number;
  overallProgress: number;
  processingTime: number;
  estimatedTimeRemaining: number;
}

export interface ProcessingStats {
  totalRows: number;
  processedRows: number;
  chunksCompleted: number;
  totalChunks: number;
  averageChunkTime: number;
  throughputRowsPerSecond: number;
  memoryUsage: number;
}

// Calculate optimal chunk size based on data characteristics and system capabilities
export const calculateOptimalChunkSize = (
  dataSize: number,
  rowComplexity: number = 1,
  availableMemory: number = getAvailableMemory()
): ChunkConfig => {
  // Base chunk size calculations
  const baseChunkSize = 1000;
  const maxChunkSize = 10000;
  const minChunkSize = 100;
  
  // Adjust for data size
  let optimalSize: number;
  
  if (dataSize <= 5000) {
    // Small datasets: process in single chunk
    optimalSize = Math.max(dataSize, minChunkSize);
  } else if (dataSize <= 50000) {
    // Medium datasets: use moderate chunks
    optimalSize = Math.min(Math.floor(dataSize / 10), 2000);
  } else {
    // Large datasets: use larger chunks for efficiency
    optimalSize = Math.min(Math.floor(dataSize / 20), maxChunkSize);
  }
  
  // Adjust for row complexity (more complex rows = smaller chunks)
  optimalSize = Math.floor(optimalSize / rowComplexity);
  
  // Adjust for available memory
  const memoryFactor = Math.min(availableMemory / (50 * 1024 * 1024), 2); // 50MB baseline
  optimalSize = Math.floor(optimalSize * memoryFactor);
  
  // Ensure within bounds
  optimalSize = Math.max(minChunkSize, Math.min(maxChunkSize, optimalSize));
  
  // Calculate total chunks
  const totalChunks = Math.ceil(dataSize / optimalSize);
  const maxChunks = Math.min(totalChunks, 50); // Limit to 50 chunks max
  
  // Determine processing method
  const processingMethod = totalChunks > 4 && isWorkerPoolSupported() ? 'parallel' : 'sequential';
  
  // Calculate worker pool size
  const maxWorkers = Math.min(navigator.hardwareConcurrency || 4, 8);
  const workerPoolSize = processingMethod === 'parallel' 
    ? Math.min(Math.ceil(totalChunks / 4), maxWorkers)
    : 1;
  
  return {
    optimalSize,
    maxChunks,
    processingMethod,
    workerPoolSize
  };
};

// Split data into optimally sized chunks
export const createDataChunks = <T>(data: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  
  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  
  return chunks;
};

// Progress tracking for chunked processing
export class ChunkProgressTracker {
  private startTime: number;
  private chunkTimes: number[] = [];
  private completedChunks: number = 0;
  private totalChunks: number;
  private onProgress?: (progress: ChunkProgress) => void;

  constructor(totalChunks: number, onProgress?: (progress: ChunkProgress) => void) {
    this.totalChunks = totalChunks;
    this.onProgress = onProgress;
    this.startTime = Date.now();
  }

  updateChunkProgress(chunkIndex: number, chunkProgress: number): void {
    const now = Date.now();
    const overallProgress = ((this.completedChunks + (chunkProgress / 100)) / this.totalChunks) * 100;
    
    // Calculate processing time and estimates
    const processingTime = now - this.startTime;
    const averageChunkTime = this.chunkTimes.length > 0 
      ? this.chunkTimes.reduce((sum, time) => sum + time, 0) / this.chunkTimes.length
      : 0;
    
    const remainingChunks = this.totalChunks - this.completedChunks - (chunkProgress / 100);
    const estimatedTimeRemaining = remainingChunks * averageChunkTime;

    const progress: ChunkProgress = {
      chunkIndex,
      totalChunks: this.totalChunks,
      chunkProgress,
      overallProgress: Math.min(100, overallProgress),
      processingTime,
      estimatedTimeRemaining
    };

    this.onProgress?.(progress);
  }

  completeChunk(chunkIndex: number): void {
    const now = Date.now();
    const chunkTime = now - this.startTime - this.chunkTimes.reduce((sum, time) => sum + time, 0);
    
    this.chunkTimes.push(chunkTime);
    this.completedChunks++;
    
    this.updateChunkProgress(chunkIndex, 100);
  }

  getStats(): ProcessingStats {
    const now = Date.now();
    const totalTime = now - this.startTime;
    const averageChunkTime = this.chunkTimes.length > 0 
      ? this.chunkTimes.reduce((sum, time) => sum + time, 0) / this.chunkTimes.length
      : 0;

    return {
      totalRows: 0, // Will be set by caller
      processedRows: 0, // Will be set by caller
      chunksCompleted: this.completedChunks,
      totalChunks: this.totalChunks,
      averageChunkTime,
      throughputRowsPerSecond: 0, // Will be calculated by caller
      memoryUsage: getMemoryUsage()
    };
  }
}

// Worker pool for parallel chunk processing
export class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private taskQueue: Array<{
    data: any;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: number) => void;
  }> = [];

  constructor(poolSize: number, workerFactory: () => Worker) {
    for (let i = 0; i < poolSize; i++) {
      const worker = workerFactory();
      this.workers.push(worker);
      this.availableWorkers.push(worker);
    }
  }

  async processChunk(
    data: any,
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject, onProgress };
      
      if (this.availableWorkers.length > 0) {
        this.executeTask(task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  private executeTask(task: {
    data: any;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: number) => void;
  }): void {
    const worker = this.availableWorkers.pop()!;
    this.busyWorkers.add(worker);

    const messageHandler = (event: MessageEvent) => {
      const { type, payload, progress, error } = event.data;

      switch (type) {
        case 'PROGRESS':
          task.onProgress?.(progress);
          break;

        case 'SUCCESS':
          worker.removeEventListener('message', messageHandler);
          worker.removeEventListener('error', errorHandler);
          this.releaseWorker(worker);
          task.resolve(payload);
          break;

        case 'ERROR':
          worker.removeEventListener('message', messageHandler);
          worker.removeEventListener('error', errorHandler);
          this.releaseWorker(worker);
          task.reject(new Error(error));
          break;
      }
    };

    const errorHandler = (error: ErrorEvent) => {
      worker.removeEventListener('message', messageHandler);
      worker.removeEventListener('error', errorHandler);
      this.releaseWorker(worker);
      task.reject(new Error(`Worker error: ${error.message}`));
    };

    worker.addEventListener('message', messageHandler);
    worker.addEventListener('error', errorHandler);

    worker.postMessage({
      type: 'PROCESS_CHUNK',
      payload: task.data
    });
  }

  private releaseWorker(worker: Worker): void {
    this.busyWorkers.delete(worker);
    this.availableWorkers.push(worker);

    // Process next task in queue
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift()!;
      this.executeTask(nextTask);
    }
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.busyWorkers.clear();
    this.taskQueue = [];
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      busyWorkers: this.busyWorkers.size,
      queuedTasks: this.taskQueue.length
    };
  }
}

// Sequential chunk processor (fallback)
export class SequentialChunkProcessor {
  private progressTracker: ChunkProgressTracker;

  constructor(
    totalChunks: number,
    onProgress?: (progress: ChunkProgress) => void
  ) {
    this.progressTracker = new ChunkProgressTracker(totalChunks, onProgress);
  }

  async processChunks<T, R>(
    chunks: T[][],
    processor: (chunk: T[], chunkIndex: number) => Promise<R>,
    onChunkComplete?: (result: R, chunkIndex: number) => void
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        // Process chunk with progress tracking
        const result = await this.processChunkWithProgress(
          chunk,
          i,
          processor
        );
        
        results.push(result);
        this.progressTracker.completeChunk(i);
        onChunkComplete?.(result, i);
        
        // Yield control to prevent blocking
        await new Promise(resolve => setTimeout(resolve, 0));
        
      } catch (error) {
        throw new Error(`Chunk ${i} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }

  private async processChunkWithProgress<T, R>(
    chunk: T[],
    chunkIndex: number,
    processor: (chunk: T[], chunkIndex: number) => Promise<R>
  ): Promise<R> {
    // Simulate progress updates during chunk processing
    const progressInterval = setInterval(() => {
      const randomProgress = Math.min(95, Math.random() * 100);
      this.progressTracker.updateChunkProgress(chunkIndex, randomProgress);
    }, 50);

    try {
      const result = await processor(chunk, chunkIndex);
      clearInterval(progressInterval);
      return result;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  }

  getStats(): ProcessingStats {
    return this.progressTracker.getStats();
  }
}

// Parallel chunk processor using worker pool
export class ParallelChunkProcessor {
  private workerPool: WorkerPool;
  private progressTracker: ChunkProgressTracker;

  constructor(
    poolSize: number,
    totalChunks: number,
    workerFactory: () => Worker,
    onProgress?: (progress: ChunkProgress) => void
  ) {
    this.workerPool = new WorkerPool(poolSize, workerFactory);
    this.progressTracker = new ChunkProgressTracker(totalChunks, onProgress);
  }

  async processChunks<T>(
    chunks: T[][],
    onChunkComplete?: (result: any, chunkIndex: number) => void
  ): Promise<any[]> {
    const chunkPromises = chunks.map((chunk, index) => 
      this.processChunk(chunk, index, onChunkComplete)
    );

    try {
      const results = await Promise.all(chunkPromises);
      return results;
    } catch (error) {
      this.terminate();
      throw error;
    }
  }

  private async processChunk<T>(
    chunk: T[],
    chunkIndex: number,
    onChunkComplete?: (result: any, chunkIndex: number) => void
  ): Promise<any> {
    try {
      const result = await this.workerPool.processChunk(
        chunk,
        (progress) => {
          this.progressTracker.updateChunkProgress(chunkIndex, progress);
        }
      );

      this.progressTracker.completeChunk(chunkIndex);
      onChunkComplete?.(result, chunkIndex);
      
      return result;
    } catch (error) {
      throw new Error(`Chunk ${chunkIndex} processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  terminate(): void {
    this.workerPool.terminate();
  }

  getStats(): ProcessingStats & { workerStats: any } {
    return {
      ...this.progressTracker.getStats(),
      workerStats: this.workerPool.getStats()
    };
  }
}

// Main chunked processing interface
export const processDataInChunks = async <T, R>(
  data: T[],
  processor: (chunk: T[], chunkIndex: number) => Promise<R>,
  options: {
    onProgress?: (progress: ChunkProgress) => void;
    onChunkComplete?: (result: R, chunkIndex: number) => void;
    customChunkSize?: number;
    forceSequential?: boolean;
  } = {}
): Promise<R[]> => {
  const {
    onProgress,
    onChunkComplete,
    customChunkSize,
    forceSequential = false
  } = options;

  // Calculate optimal configuration
  const config = calculateOptimalChunkSize(
    data.length,
    estimateRowComplexity(data[0]),
    getAvailableMemory()
  );

  const chunkSize = customChunkSize || config.optimalSize;
  const chunks = createDataChunks(data, chunkSize);

  console.log(`Processing ${data.length} rows in ${chunks.length} chunks of size ${chunkSize}`);
  console.log(`Using ${config.processingMethod} processing with ${config.workerPoolSize} workers`);

  // Choose processing method
  if (forceSequential || config.processingMethod === 'sequential') {
    const processor_seq = new SequentialChunkProcessor(chunks.length, onProgress);
    return await processor_seq.processChunks(chunks, processor, onChunkComplete);
  } else {
    const processor_par = new ParallelChunkProcessor(
      config.workerPoolSize,
      chunks.length,
      () => new Worker(
        new URL('../workers/chunkProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      ),
      onProgress
    );

    try {
      return await processor_par.processChunks(chunks, onChunkComplete);
    } finally {
      processor_par.terminate();
    }
  }
};

// Utility functions
const getAvailableMemory = (): number => {
  // Estimate available memory (fallback to 100MB if not available)
  if ('memory' in performance && 'usedJSHeapSize' in (performance as any).memory) {
    const memory = (performance as any).memory;
    return Math.max(50 * 1024 * 1024, memory.jsHeapSizeLimit - memory.usedJSHeapSize);
  }
  return 100 * 1024 * 1024; // 100MB default
};

const getMemoryUsage = (): number => {
  if ('memory' in performance && 'usedJSHeapSize' in (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};

const estimateRowComplexity = (sampleRow: any): number => {
  if (!sampleRow) return 1;
  
  const columnCount = Object.keys(sampleRow).length;
  const avgValueLength = Object.values(sampleRow)
    .map(v => String(v).length)
    .reduce((sum, len) => sum + len, 0) / columnCount;
  
  // Complexity factor based on columns and data size
  return Math.max(1, Math.min(3, (columnCount / 10) + (avgValueLength / 100)));
};

const isWorkerPoolSupported = (): boolean => {
  return typeof Worker !== 'undefined' && 
         typeof navigator !== 'undefined' && 
         (navigator.hardwareConcurrency || 1) > 1;
};