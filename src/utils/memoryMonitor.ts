// Memory monitoring and management utilities
export interface MemoryStats {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
  availableMemory: number;
  isNearLimit: boolean;
  isCritical: boolean;
}

export interface MemoryThresholds {
  warning: number; // Percentage at which to show warning
  critical: number; // Percentage at which to take action
  maxFileSize: number; // Maximum file size to process
}

export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private thresholds: MemoryThresholds;
  private listeners: Array<(stats: MemoryStats) => void> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastGCTime: number = 0;
  private gcCooldown: number = 5000; // 5 seconds between GC attempts

  private constructor() {
    this.thresholds = {
      warning: 75, // Show warning at 75% memory usage
      critical: 90, // Take action at 90% memory usage
      maxFileSize: 100 * 1024 * 1024 // 100MB max file size
    };
  }

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  // Get current memory statistics
  getMemoryStats(): MemoryStats {
    const performance = window.performance as any;
    
    if (performance?.memory) {
      const memory = performance.memory;
      const usedPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
      
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedPercentage,
        availableMemory: memory.jsHeapSizeLimit - memory.usedJSHeapSize,
        isNearLimit: usedPercentage >= this.thresholds.warning,
        isCritical: usedPercentage >= this.thresholds.critical
      };
    }

    // Fallback for browsers without memory API
    return {
      usedJSHeapSize: 0,
      totalJSHeapSize: 0,
      jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // Assume 2GB limit
      usedPercentage: 0,
      availableMemory: 2 * 1024 * 1024 * 1024,
      isNearLimit: false,
      isCritical: false
    };
  }

  // Format bytes to human readable format
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  // Check if file size is acceptable
  canProcessFile(fileSize: number): { canProcess: boolean; reason?: string } {
    const stats = this.getMemoryStats();
    
    if (fileSize > this.thresholds.maxFileSize) {
      return {
        canProcess: false,
        reason: `File size (${this.formatBytes(fileSize)}) exceeds maximum limit (${this.formatBytes(this.thresholds.maxFileSize)})`
      };
    }

    // Estimate memory needed (rough calculation: file size * 3 for processing overhead)
    const estimatedMemoryNeeded = fileSize * 3;
    
    if (estimatedMemoryNeeded > stats.availableMemory) {
      return {
        canProcess: false,
        reason: `Insufficient memory. Need ~${this.formatBytes(estimatedMemoryNeeded)}, available: ${this.formatBytes(stats.availableMemory)}`
      };
    }

    if (stats.isCritical) {
      return {
        canProcess: false,
        reason: 'Memory usage is critically high. Please refresh the page and try again.'
      };
    }

    return { canProcess: true };
  }

  // Trigger garbage collection if available
  triggerGarbageCollection(): boolean {
    const now = Date.now();
    
    // Respect cooldown period
    if (now - this.lastGCTime < this.gcCooldown) {
      return false;
    }

    // Try to trigger GC if available (Chrome with --enable-precise-memory-info)
    if (window.gc && typeof window.gc === 'function') {
      try {
        window.gc();
        this.lastGCTime = now;
        console.log('Manual garbage collection triggered');
        return true;
      } catch (error) {
        console.warn('Failed to trigger garbage collection:', error);
      }
    }

    // Alternative: create memory pressure to encourage GC
    try {
      const arrays: any[] = [];
      for (let i = 0; i < 10; i++) {
        arrays.push(new Array(100000).fill(0));
      }
      // Let arrays go out of scope
      arrays.length = 0;
      this.lastGCTime = now;
      return true;
    } catch (error) {
      console.warn('Failed to create memory pressure for GC:', error);
      return false;
    }
  }

  // Start monitoring memory usage
  startMonitoring(interval: number = 1000): void {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    this.monitoringInterval = setInterval(() => {
      const stats = this.getMemoryStats();
      
      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(stats);
        } catch (error) {
          console.error('Error in memory monitor listener:', error);
        }
      });

      // Auto-trigger GC if memory is critical
      if (stats.isCritical) {
        console.warn('Critical memory usage detected, attempting garbage collection');
        this.triggerGarbageCollection();
      }

    }, interval);
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  // Add memory stats listener
  addListener(listener: (stats: MemoryStats) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Update thresholds
  updateThresholds(newThresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  // Get memory recommendations
  getMemoryRecommendations(stats: MemoryStats): string[] {
    const recommendations: string[] = [];

    if (stats.isCritical) {
      recommendations.push('Memory usage is critically high - consider refreshing the page');
      recommendations.push('Close other browser tabs to free up memory');
      recommendations.push('Process smaller files or split large files into chunks');
    } else if (stats.isNearLimit) {
      recommendations.push('Memory usage is high - monitor closely');
      recommendations.push('Consider processing files in smaller batches');
    }

    if (stats.usedPercentage > 50) {
      recommendations.push('Clear browser cache if processing multiple large files');
    }

    return recommendations;
  }

  // Estimate processing capacity
  estimateProcessingCapacity(): {
    maxRows: number;
    maxFileSize: number;
    recommendedChunkSize: number;
  } {
    const stats = this.getMemoryStats();
    const availableMemory = stats.availableMemory;
    
    // Conservative estimates (assuming 1KB per row average)
    const avgRowSize = 1024;
    const processingOverhead = 3; // 3x memory overhead for processing
    
    const maxRows = Math.floor(availableMemory / (avgRowSize * processingOverhead));
    const maxFileSize = Math.floor(availableMemory / processingOverhead);
    const recommendedChunkSize = Math.min(10000, Math.floor(maxRows / 10));

    return {
      maxRows: Math.max(1000, maxRows), // Minimum 1000 rows
      maxFileSize: Math.max(1024 * 1024, maxFileSize), // Minimum 1MB
      recommendedChunkSize: Math.max(100, recommendedChunkSize) // Minimum 100 rows
    };
  }
}

// Global memory monitor instance
export const memoryMonitor = MemoryMonitor.getInstance();

// Utility functions
export const formatMemorySize = (bytes: number): string => {
  return memoryMonitor.formatBytes(bytes);
};

export const getCurrentMemoryStats = (): MemoryStats => {
  return memoryMonitor.getMemoryStats();
};

export const canProcessFile = (fileSize: number) => {
  return memoryMonitor.canProcessFile(fileSize);
};

export const triggerGC = (): boolean => {
  return memoryMonitor.triggerGarbageCollection();
};

// Memory pressure detection
export const detectMemoryPressure = (): 'low' | 'medium' | 'high' | 'critical' => {
  const stats = memoryMonitor.getMemoryStats();
  
  if (stats.usedPercentage >= 90) return 'critical';
  if (stats.usedPercentage >= 75) return 'high';
  if (stats.usedPercentage >= 50) return 'medium';
  return 'low';
};

// Declare global gc function for TypeScript
declare global {
  interface Window {
    gc?: () => void;
  }
}