import { useState, useEffect, useCallback } from 'react';
import { memoryMonitor, MemoryStats } from '../utils/memoryMonitor';

interface UseMemoryMonitorOptions {
  enableAutoGC?: boolean;
  warningThreshold?: number;
  criticalThreshold?: number;
  onWarning?: (stats: MemoryStats) => void;
  onCritical?: (stats: MemoryStats) => void;
}

export const useMemoryMonitor = (options: UseMemoryMonitorOptions = {}) => {
  const {
    enableAutoGC = true,
    warningThreshold = 75,
    criticalThreshold = 90,
    onWarning,
    onCritical
  } = options;

  const [memoryStats, setMemoryStats] = useState<MemoryStats>(memoryMonitor.getMemoryStats());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastGCTime, setLastGCTime] = useState<number>(0);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    memoryMonitor.startMonitoring(1000);
    setIsMonitoring(true);

    const unsubscribe = memoryMonitor.addListener((stats) => {
      setMemoryStats(stats);

      // Handle warnings and critical states
      if (stats.usedPercentage >= criticalThreshold) {
        onCritical?.(stats);
        
        // Auto-trigger GC if enabled
        if (enableAutoGC) {
          const now = Date.now();
          if (now - lastGCTime > 5000) { // 5 second cooldown
            memoryMonitor.triggerGarbageCollection();
            setLastGCTime(now);
          }
        }
      } else if (stats.usedPercentage >= warningThreshold) {
        onWarning?.(stats);
      }
    });

    return unsubscribe;
  }, [isMonitoring, warningThreshold, criticalThreshold, onWarning, onCritical, enableAutoGC, lastGCTime]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    memoryMonitor.stopMonitoring();
    setIsMonitoring(false);
  }, []);

  // Manual garbage collection
  const triggerGC = useCallback(() => {
    const success = memoryMonitor.triggerGarbageCollection();
    if (success) {
      setLastGCTime(Date.now());
      // Update stats after GC
      setTimeout(() => {
        setMemoryStats(memoryMonitor.getMemoryStats());
      }, 100);
    }
    return success;
  }, []);

  // Check if file can be processed
  const canProcessFile = useCallback((fileSize: number) => {
    return memoryMonitor.canProcessFile(fileSize);
  }, []);

  // Get processing recommendations
  const getProcessingRecommendations = useCallback(() => {
    return memoryMonitor.getMemoryRecommendations(memoryStats);
  }, [memoryStats]);

  // Get estimated capacity
  const getProcessingCapacity = useCallback(() => {
    return memoryMonitor.estimateProcessingCapacity();
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    const unsubscribe = startMonitoring();
    
    return () => {
      unsubscribe?.();
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    // State
    memoryStats,
    isMonitoring,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    triggerGC,
    
    // Utilities
    canProcessFile,
    getProcessingRecommendations,
    getProcessingCapacity,
    
    // Computed values
    isNearLimit: memoryStats.isNearLimit,
    isCritical: memoryStats.isCritical,
    usedPercentage: memoryStats.usedPercentage,
    availableMemory: memoryStats.availableMemory,
    
    // Formatters
    formatBytes: memoryMonitor.formatBytes.bind(memoryMonitor)
  };
};

// Hook for file upload validation
export const useFileMemoryValidation = () => {
  const { canProcessFile, memoryStats, formatBytes } = useMemoryMonitor();

  const validateFile = useCallback((file: File) => {
    const result = canProcessFile(file.size);
    
    return {
      ...result,
      fileSize: file.size,
      fileSizeFormatted: formatBytes(file.size),
      availableMemory: memoryStats.availableMemory,
      availableMemoryFormatted: formatBytes(memoryStats.availableMemory),
      memoryUsagePercentage: memoryStats.usedPercentage
    };
  }, [canProcessFile, memoryStats, formatBytes]);

  return {
    validateFile,
    memoryStats,
    formatBytes
  };
};

// Hook for processing optimization
export const useProcessingOptimization = () => {
  const { memoryStats, getProcessingCapacity } = useMemoryMonitor();

  const getOptimalChunkSize = useCallback((totalRows: number) => {
    const capacity = getProcessingCapacity();
    
    if (totalRows <= capacity.maxRows) {
      return Math.min(totalRows, capacity.recommendedChunkSize);
    }
    
    // For large datasets, calculate optimal chunk size
    const numChunks = Math.ceil(totalRows / capacity.maxRows);
    return Math.ceil(totalRows / numChunks);
  }, [getProcessingCapacity]);

  const shouldUseChunkedProcessing = useCallback((totalRows: number) => {
    const capacity = getProcessingCapacity();
    return totalRows > capacity.recommendedChunkSize;
  }, [getProcessingCapacity]);

  const getProcessingStrategy = useCallback((totalRows: number) => {
    const capacity = getProcessingCapacity();
    
    if (totalRows <= 1000) {
      return 'direct';
    } else if (totalRows <= capacity.recommendedChunkSize) {
      return 'worker';
    } else {
      return 'chunked';
    }
  }, [getProcessingCapacity]);

  return {
    getOptimalChunkSize,
    shouldUseChunkedProcessing,
    getProcessingStrategy,
    getProcessingCapacity,
    memoryStats
  };
};