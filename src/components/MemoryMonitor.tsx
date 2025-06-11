import React, { useState, useEffect } from 'react';
import { memoryMonitor, MemoryStats, formatMemorySize } from '../utils/memoryMonitor';
import { 
  Activity, 
  AlertTriangle, 
  AlertCircle, 
  Trash2, 
  Settings, 
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw
} from 'lucide-react';

interface MemoryMonitorProps {
  showDetailed?: boolean;
  className?: string;
  onMemoryWarning?: (stats: MemoryStats) => void;
  onMemoryCritical?: (stats: MemoryStats) => void;
}

const MemoryMonitor: React.FC<MemoryMonitorProps> = ({
  showDetailed = false,
  className = '',
  onMemoryWarning,
  onMemoryCritical
}) => {
  const [memoryStats, setMemoryStats] = useState<MemoryStats>(memoryMonitor.getMemoryStats());
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [history, setHistory] = useState<Array<{ time: number; stats: MemoryStats }>>([]);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Start monitoring when component mounts
    memoryMonitor.startMonitoring(1000);
    setIsMonitoring(true);

    const unsubscribe = memoryMonitor.addListener((stats) => {
      setMemoryStats(stats);
      
      // Add to history (keep last 60 entries = 1 minute)
      setHistory(prev => {
        const newHistory = [...prev, { time: Date.now(), stats }];
        return newHistory.slice(-60);
      });

      // Trigger callbacks
      if (stats.isCritical && onMemoryCritical) {
        onMemoryCritical(stats);
      } else if (stats.isNearLimit && onMemoryWarning) {
        onMemoryWarning(stats);
      }
    });

    return () => {
      unsubscribe();
      memoryMonitor.stopMonitoring();
      setIsMonitoring(false);
    };
  }, [onMemoryWarning, onMemoryCritical]);

  const handleGarbageCollection = () => {
    const success = memoryMonitor.triggerGarbageCollection();
    if (success) {
      // Force update stats after GC
      setTimeout(() => {
        setMemoryStats(memoryMonitor.getMemoryStats());
      }, 100);
    }
  };

  const getMemoryStatusColor = () => {
    if (memoryStats.isCritical) return 'text-red-600 bg-red-50 border-red-200';
    if (memoryStats.isNearLimit) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getMemoryStatusIcon = () => {
    if (memoryStats.isCritical) return <AlertCircle className="h-4 w-4" />;
    if (memoryStats.isNearLimit) return <AlertTriangle className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  const getMemoryTrend = () => {
    if (history.length < 10) return null;
    
    const recent = history.slice(-10);
    const oldAvg = recent.slice(0, 5).reduce((sum, h) => sum + h.stats.usedPercentage, 0) / 5;
    const newAvg = recent.slice(-5).reduce((sum, h) => sum + h.stats.usedPercentage, 0) / 5;
    
    const diff = newAvg - oldAvg;
    
    if (Math.abs(diff) < 1) return { icon: <Minus className="h-3 w-3" />, label: 'Stable', color: 'text-blue-500' };
    if (diff > 0) return { icon: <TrendingUp className="h-3 w-3" />, label: 'Increasing', color: 'text-red-500' };
    return { icon: <TrendingDown className="h-3 w-3" />, label: 'Decreasing', color: 'text-green-500' };
  };

  const trend = getMemoryTrend();
  const recommendations = memoryMonitor.getMemoryRecommendations(memoryStats);
  const capacity = memoryMonitor.estimateProcessingCapacity();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-gray-500" />
            <h3 className="text-sm font-medium text-gray-700">Memory Monitor</h3>
            {isMonitoring && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-gray-500">Live</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {trend && (
              <div className={`flex items-center space-x-1 ${trend.color}`}>
                {trend.icon}
                <span className="text-xs">{trend.label}</span>
              </div>
            )}
            
            <button
              onClick={handleGarbageCollection}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Trigger garbage collection"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Memory settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Memory Status */}
      <div className="p-4">
        {/* Main Memory Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              {getMemoryStatusIcon()}
              <span className="text-sm font-medium text-gray-700">
                Memory Usage
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {memoryStats.usedPercentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                memoryStats.isCritical ? 'bg-red-500' :
                memoryStats.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, memoryStats.usedPercentage)}%` }}
            >
              {/* Animated shimmer for active monitoring */}
              {isMonitoring && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Memory Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-bold text-gray-800">
              {formatMemorySize(memoryStats.usedJSHeapSize)}
            </div>
            <div className="text-xs text-gray-500">Used</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-bold text-gray-800">
              {formatMemorySize(memoryStats.availableMemory)}
            </div>
            <div className="text-xs text-gray-500">Available</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-bold text-gray-800">
              {formatMemorySize(memoryStats.jsHeapSizeLimit)}
            </div>
            <div className="text-xs text-gray-500">Limit</div>
          </div>
          
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="text-sm font-bold text-gray-800">
              {capacity.maxRows.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">Est. Max Rows</div>
          </div>
        </div>

        {/* Warnings and Recommendations */}
        {(memoryStats.isNearLimit || memoryStats.isCritical) && (
          <div className={`p-3 rounded-lg border ${getMemoryStatusColor()} mb-4`}>
            <div className="flex items-start space-x-2">
              {getMemoryStatusIcon()}
              <div className="flex-grow">
                <h4 className="text-sm font-medium">
                  {memoryStats.isCritical ? 'Critical Memory Usage' : 'High Memory Usage'}
                </h4>
                {recommendations.length > 0 && (
                  <ul className="mt-1 text-xs space-y-1">
                    {recommendations.map((rec, index) => (
                      <li key={index}>• {rec}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detailed View */}
        {showDetailed && (
          <div className="space-y-3">
            {/* Memory History Chart */}
            {history.length > 10 && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <h5 className="text-xs font-medium text-gray-600 mb-2">Memory Usage History</h5>
                <div className="flex items-end space-x-1 h-12">
                  {history.slice(-30).map((entry, index) => {
                    const height = (entry.stats.usedPercentage / 100) * 100;
                    const color = entry.stats.isCritical ? 'bg-red-500' :
                                 entry.stats.isNearLimit ? 'bg-yellow-500' : 'bg-green-500';
                    
                    return (
                      <div
                        key={index}
                        className={`flex-1 rounded-t ${color} transition-all duration-300`}
                        style={{ height: `${height}%` }}
                        title={`${entry.stats.usedPercentage.toFixed(1)}% at ${new Date(entry.time).toLocaleTimeString()}`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>30s ago</span>
                  <span>Now</span>
                </div>
              </div>
            )}

            {/* Processing Capacity */}
            <div className="p-3 bg-blue-50 rounded-lg">
              <h5 className="text-xs font-medium text-blue-800 mb-2">Estimated Processing Capacity</h5>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-blue-600">Max Rows:</span>
                  <div className="font-medium">{capacity.maxRows.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-blue-600">Max File:</span>
                  <div className="font-medium">{formatMemorySize(capacity.maxFileSize)}</div>
                </div>
                <div>
                  <span className="text-blue-600">Chunk Size:</span>
                  <div className="font-medium">{capacity.recommendedChunkSize.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Memory Settings</h5>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Auto Garbage Collection</span>
                <button
                  onClick={handleGarbageCollection}
                  className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Trigger Now
                </button>
              </div>
              
              <div className="text-xs text-gray-500">
                <p>• Memory monitoring updates every second</p>
                <p>• Automatic GC triggers at 90% usage</p>
                <p>• File size limits are dynamically calculated</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryMonitor;