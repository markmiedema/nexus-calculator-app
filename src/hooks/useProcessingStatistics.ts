import { useState, useCallback, useRef, useEffect } from 'react';
import { ProcessingStatistics } from '../components/ProcessingStatistics';

interface UseProcessingStatisticsOptions {
  updateInterval?: number;
  onStatisticsUpdate?: (stats: ProcessingStatistics) => void;
}

export const useProcessingStatistics = (options: UseProcessingStatisticsOptions = {}) => {
  const { updateInterval = 1000, onStatisticsUpdate } = options;
  
  const [statistics, setStatistics] = useState<ProcessingStatistics | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Refs for tracking data
  const startTimeRef = useRef<number>(0);
  const totalRowsRef = useRef<number>(0);
  const processedRowsRef = useRef<number>(0);
  const validRowsRef = useRef<number>(0);
  const invalidRowsRef = useRef<number>(0);
  const skippedRowsRef = useRef<number>(0);
  const warningCountRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const currentStageRef = useRef<string>('');
  const completedStagesRef = useRef<number>(0);
  const totalStagesRef = useRef<number>(0);
  const throughputHistoryRef = useRef<number[]>([]);
  const cleaningOperationsRef = useRef({
    currencyFormatted: 0,
    datesNormalized: 0,
    statesConverted: 0,
    duplicatesRemoved: 0
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tracking
  const initializeTracking = useCallback((totalRows: number, totalStages: number = 8) => {
    startTimeRef.current = Date.now();
    totalRowsRef.current = totalRows;
    totalStagesRef.current = totalStages;
    processedRowsRef.current = 0;
    validRowsRef.current = 0;
    invalidRowsRef.current = 0;
    skippedRowsRef.current = 0;
    warningCountRef.current = 0;
    errorCountRef.current = 0;
    currentStageRef.current = 'Initializing';
    completedStagesRef.current = 0;
    throughputHistoryRef.current = [];
    cleaningOperationsRef.current = {
      currencyFormatted: 0,
      datesNormalized: 0,
      statesConverted: 0,
      duplicatesRemoved: 0
    };
    
    setIsTracking(true);
    startTracking();
  }, []);

  // Start tracking interval
  const startTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      updateStatistics();
    }, updateInterval);
  }, [updateInterval]);

  // Update statistics
  const updateStatistics = useCallback(() => {
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTimeRef.current;
    const throughputRowsPerSecond = processedRowsRef.current / (elapsedTime / 1000);
    
    // Update throughput history
    throughputHistoryRef.current.push(throughputRowsPerSecond);
    if (throughputHistoryRef.current.length > 60) {
      throughputHistoryRef.current.shift();
    }

    // Estimate completion time
    const remainingRows = totalRowsRef.current - processedRowsRef.current;
    const estimatedEndTime = throughputRowsPerSecond > 0 
      ? currentTime + (remainingRows / throughputRowsPerSecond) * 1000
      : null;

    // Get memory usage
    const memoryUsage = getMemoryUsage();
    const peakMemoryUsage = Math.max(memoryUsage, statistics?.peakMemoryUsage || memoryUsage);

    // Estimate CPU usage based on throughput
    const expectedThroughput = 1000; // baseline
    const cpuUsage = Math.min(100, (throughputRowsPerSecond / expectedThroughput) * 50);

    const newStatistics: ProcessingStatistics = {
      // File statistics
      totalRows: totalRowsRef.current,
      processedRows: processedRowsRef.current,
      validRows: validRowsRef.current,
      invalidRows: invalidRowsRef.current,
      skippedRows: skippedRowsRef.current,
      
      // Processing metrics
      startTime: startTimeRef.current,
      currentTime,
      estimatedEndTime,
      throughputRowsPerSecond,
      
      // Data quality
      warningCount: warningCountRef.current,
      errorCount: errorCountRef.current,
      cleaningOperations: { ...cleaningOperationsRef.current },
      
      // Memory and performance
      memoryUsage,
      peakMemoryUsage,
      cpuUsage,
      
      // Stage information
      currentStage: currentStageRef.current,
      completedStages: completedStagesRef.current,
      totalStages: totalStagesRef.current
    };

    setStatistics(newStatistics);
    onStatisticsUpdate?.(newStatistics);
  }, [statistics?.peakMemoryUsage, onStatisticsUpdate]);

  // Update methods
  const updateProcessedRows = useCallback((count: number) => {
    processedRowsRef.current = count;
  }, []);

  const addProcessedRows = useCallback((count: number) => {
    processedRowsRef.current += count;
  }, []);

  const updateValidRows = useCallback((count: number) => {
    validRowsRef.current = count;
  }, []);

  const addValidRows = useCallback((count: number) => {
    validRowsRef.current += count;
  }, []);

  const updateInvalidRows = useCallback((count: number) => {
    invalidRowsRef.current = count;
  }, []);

  const addInvalidRows = useCallback((count: number) => {
    invalidRowsRef.current += count;
  }, []);

  const updateSkippedRows = useCallback((count: number) => {
    skippedRowsRef.current = count;
  }, []);

  const addSkippedRows = useCallback((count: number) => {
    skippedRowsRef.current += count;
  }, []);

  const updateWarningCount = useCallback((count: number) => {
    warningCountRef.current = count;
  }, []);

  const addWarning = useCallback(() => {
    warningCountRef.current += 1;
  }, []);

  const updateErrorCount = useCallback((count: number) => {
    errorCountRef.current = count;
  }, []);

  const addError = useCallback(() => {
    errorCountRef.current += 1;
  }, []);

  const updateCurrentStage = useCallback((stage: string) => {
    currentStageRef.current = stage;
  }, []);

  const updateCompletedStages = useCallback((count: number) => {
    completedStagesRef.current = count;
  }, []);

  const addCompletedStage = useCallback(() => {
    completedStagesRef.current += 1;
  }, []);

  const updateCleaningOperation = useCallback((
    operation: keyof typeof cleaningOperationsRef.current,
    count: number
  ) => {
    cleaningOperationsRef.current[operation] = count;
  }, []);

  const addCleaningOperation = useCallback((
    operation: keyof typeof cleaningOperationsRef.current,
    count: number = 1
  ) => {
    cleaningOperationsRef.current[operation] += count;
  }, []);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsTracking(false);
    
    // Final update
    updateStatistics();
  }, [updateStatistics]);

  // Reset tracking
  const resetTracking = useCallback(() => {
    stopTracking();
    setStatistics(null);
    
    // Reset all refs
    startTimeRef.current = 0;
    totalRowsRef.current = 0;
    processedRowsRef.current = 0;
    validRowsRef.current = 0;
    invalidRowsRef.current = 0;
    skippedRowsRef.current = 0;
    warningCountRef.current = 0;
    errorCountRef.current = 0;
    currentStageRef.current = '';
    completedStagesRef.current = 0;
    totalStagesRef.current = 0;
    throughputHistoryRef.current = [];
    cleaningOperationsRef.current = {
      currencyFormatted: 0,
      datesNormalized: 0,
      statesConverted: 0,
      duplicatesRemoved: 0
    };
  }, [stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Get current statistics snapshot
  const getCurrentStatistics = useCallback((): ProcessingStatistics | null => {
    if (!isTracking) return null;
    
    const currentTime = Date.now();
    const elapsedTime = currentTime - startTimeRef.current;
    const throughputRowsPerSecond = processedRowsRef.current / (elapsedTime / 1000);
    
    return {
      totalRows: totalRowsRef.current,
      processedRows: processedRowsRef.current,
      validRows: validRowsRef.current,
      invalidRows: invalidRowsRef.current,
      skippedRows: skippedRowsRef.current,
      startTime: startTimeRef.current,
      currentTime,
      estimatedEndTime: throughputRowsPerSecond > 0 
        ? currentTime + ((totalRowsRef.current - processedRowsRef.current) / throughputRowsPerSecond) * 1000
        : null,
      throughputRowsPerSecond,
      warningCount: warningCountRef.current,
      errorCount: errorCountRef.current,
      cleaningOperations: { ...cleaningOperationsRef.current },
      memoryUsage: getMemoryUsage(),
      peakMemoryUsage: statistics?.peakMemoryUsage || getMemoryUsage(),
      cpuUsage: Math.min(100, (throughputRowsPerSecond / 1000) * 50),
      currentStage: currentStageRef.current,
      completedStages: completedStagesRef.current,
      totalStages: totalStagesRef.current
    };
  }, [isTracking, statistics?.peakMemoryUsage]);

  return {
    // State
    statistics,
    isTracking,
    
    // Control methods
    initializeTracking,
    stopTracking,
    resetTracking,
    getCurrentStatistics,
    
    // Update methods
    updateProcessedRows,
    addProcessedRows,
    updateValidRows,
    addValidRows,
    updateInvalidRows,
    addInvalidRows,
    updateSkippedRows,
    addSkippedRows,
    updateWarningCount,
    addWarning,
    updateErrorCount,
    addError,
    updateCurrentStage,
    updateCompletedStages,
    addCompletedStage,
    updateCleaningOperation,
    addCleaningOperation
  };
};

// Utility function to get memory usage
const getMemoryUsage = (): number => {
  if ('memory' in performance && 'usedJSHeapSize' in (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize;
  }
  return 0;
};