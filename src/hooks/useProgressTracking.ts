import { useState, useCallback, useRef, useEffect } from 'react';
import { ProcessingStage, ProcessingMetrics } from '../components/ProgressIndicator';

interface UseProgressTrackingOptions {
  onStageChange?: (stage: ProcessingStage) => void;
  onMetricsUpdate?: (metrics: ProcessingMetrics) => void;
  updateInterval?: number;
}

export const useProgressTracking = (options: UseProgressTrackingOptions = {}) => {
  const [stages, setStages] = useState<ProcessingStage[]>([]);
  const [metrics, setMetrics] = useState<ProcessingMetrics | null>(null);
  const [currentStageId, setCurrentStageId] = useState<string | null>(null);
  
  const startTimeRef = useRef<number>(0);
  const processedRowsRef = useRef<number>(0);
  const totalRowsRef = useRef<number>(0);
  const throughputHistoryRef = useRef<number[]>([]);
  const lastUpdateTimeRef = useRef<number>(0);
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { updateInterval = 500 } = options;

  // Initialize tracking
  const initializeTracking = useCallback((totalRows: number, stageDefinitions: Omit<ProcessingStage, 'progress' | 'status'>[]) => {
    startTimeRef.current = Date.now();
    totalRowsRef.current = totalRows;
    processedRowsRef.current = 0;
    throughputHistoryRef.current = [];
    lastUpdateTimeRef.current = Date.now();

    const initialStages: ProcessingStage[] = stageDefinitions.map(stage => ({
      ...stage,
      progress: 0,
      status: 'pending'
    }));

    setStages(initialStages);
    setCurrentStageId(null);
    
    // Start metrics tracking
    startMetricsTracking();
  }, []);

  // Start metrics tracking interval
  const startMetricsTracking = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }

    metricsIntervalRef.current = setInterval(() => {
      updateMetrics();
    }, updateInterval);
  }, [updateInterval]);

  // Update processing metrics
  const updateMetrics = useCallback(() => {
    const now = Date.now();
    const elapsedTime = now - startTimeRef.current;
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    
    if (timeSinceLastUpdate === 0) return;

    // Calculate throughput
    const rowsPerSecond = processedRowsRef.current / (elapsedTime / 1000);
    
    // Update throughput history
    throughputHistoryRef.current.push(rowsPerSecond);
    if (throughputHistoryRef.current.length > 50) {
      throughputHistoryRef.current.shift();
    }

    // Calculate estimated time remaining
    const remainingRows = totalRowsRef.current - processedRowsRef.current;
    const estimatedTimeRemaining = rowsPerSecond > 0 
      ? (remainingRows / rowsPerSecond) * 1000 
      : 0;

    // Get memory usage
    const memoryUsage = getMemoryUsage();

    // Get current operation
    const currentStage = stages.find(stage => stage.status === 'active');
    const currentOperation = currentStage 
      ? `${currentStage.name}: ${currentStage.description}`
      : 'Processing data...';

    const newMetrics: ProcessingMetrics = {
      rowsPerSecond,
      totalRows: totalRowsRef.current,
      processedRows: processedRowsRef.current,
      estimatedTimeRemaining,
      elapsedTime,
      memoryUsage,
      currentOperation,
      throughputHistory: [...throughputHistoryRef.current]
    };

    setMetrics(newMetrics);
    options.onMetricsUpdate?.(newMetrics);
    lastUpdateTimeRef.current = now;
  }, [stages, options]);

  // Start a processing stage
  const startStage = useCallback((stageId: string) => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const updatedStage = {
          ...stage,
          status: 'active' as const,
          startTime: Date.now(),
          progress: 0
        };
        options.onStageChange?.(updatedStage);
        return updatedStage;
      }
      return stage;
    }));
    setCurrentStageId(stageId);
  }, [options]);

  // Update stage progress
  const updateStageProgress = useCallback((stageId: string, progress: number) => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId && stage.status === 'active') {
        const updatedStage = {
          ...stage,
          progress: Math.min(100, Math.max(0, progress))
        };
        options.onStageChange?.(updatedStage);
        return updatedStage;
      }
      return stage;
    }));
  }, [options]);

  // Complete a processing stage
  const completeStage = useCallback((stageId: string) => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const updatedStage = {
          ...stage,
          status: 'completed' as const,
          progress: 100,
          endTime: Date.now()
        };
        options.onStageChange?.(updatedStage);
        return updatedStage;
      }
      return stage;
    }));
    
    if (currentStageId === stageId) {
      setCurrentStageId(null);
    }
  }, [currentStageId, options]);

  // Mark stage as error
  const errorStage = useCallback((stageId: string) => {
    setStages(prev => prev.map(stage => {
      if (stage.id === stageId) {
        const updatedStage = {
          ...stage,
          status: 'error' as const,
          endTime: Date.now()
        };
        options.onStageChange?.(updatedStage);
        return updatedStage;
      }
      return stage;
    }));
  }, [options]);

  // Update processed rows count
  const updateProcessedRows = useCallback((count: number) => {
    processedRowsRef.current = count;
  }, []);

  // Add processed rows (incremental)
  const addProcessedRows = useCallback((count: number) => {
    processedRowsRef.current += count;
  }, []);

  // Reset tracking
  const resetTracking = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }
    
    setStages([]);
    setMetrics(null);
    setCurrentStageId(null);
    startTimeRef.current = 0;
    processedRowsRef.current = 0;
    totalRowsRef.current = 0;
    throughputHistoryRef.current = [];
    lastUpdateTimeRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  // Get overall progress
  const getOverallProgress = useCallback(() => {
    if (totalRowsRef.current === 0) return 0;
    return (processedRowsRef.current / totalRowsRef.current) * 100;
  }, []);

  // Get stage progress summary
  const getStagesSummary = useCallback(() => {
    const completed = stages.filter(s => s.status === 'completed').length;
    const active = stages.filter(s => s.status === 'active').length;
    const error = stages.filter(s => s.status === 'error').length;
    const pending = stages.filter(s => s.status === 'pending').length;
    
    return { completed, active, error, pending, total: stages.length };
  }, [stages]);

  return {
    // State
    stages,
    metrics,
    currentStageId,
    
    // Actions
    initializeTracking,
    startStage,
    updateStageProgress,
    completeStage,
    errorStage,
    updateProcessedRows,
    addProcessedRows,
    resetTracking,
    
    // Computed
    getOverallProgress,
    getStagesSummary,
    
    // Utilities
    isTracking: metricsIntervalRef.current !== null
  };
};

// Utility function to get memory usage
const getMemoryUsage = (): number => {
  if ('memory' in performance && 'usedJSHeapSize' in (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};