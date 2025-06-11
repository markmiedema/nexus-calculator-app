import React from 'react';
import { Clock, Zap, BarChart3, Cpu, CheckCircle, Loader, AlertCircle } from 'lucide-react';

export interface ProcessingStage {
  id: string;
  name: string;
  description: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'error';
  startTime?: number;
  endTime?: number;
}

export interface ProcessingMetrics {
  rowsPerSecond: number;
  totalRows: number;
  processedRows: number;
  estimatedTimeRemaining: number;
  elapsedTime: number;
  memoryUsage: number;
  currentOperation: string;
  throughputHistory: number[];
}

interface ProgressIndicatorProps {
  progress: number;
  message?: string;
  stages?: ProcessingStage[];
  metrics?: ProcessingMetrics;
  showDetailed?: boolean;
  className?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message = 'Processing...',
  stages = [],
  metrics,
  showDetailed = false,
  className = ''
}) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getStageIcon = (stage: ProcessingStage) => {
    switch (stage.status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'active':
        return <Loader className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return 'bg-green-500';
    if (progress >= 70) return 'bg-blue-500';
    if (progress >= 40) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getThroughputTrend = () => {
    if (!metrics?.throughputHistory || metrics.throughputHistory.length < 2) return 'stable';
    
    const recent = metrics.throughputHistory.slice(-3);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const latest = recent[recent.length - 1];
    
    if (latest > average * 1.1) return 'increasing';
    if (latest < average * 0.9) return 'decreasing';
    return 'stable';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {/* Main Progress Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center space-x-2">
            <Loader className="h-4 w-4 text-blue-500 animate-spin" />
            <span className="text-sm font-medium text-gray-700">{message}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{progress.toFixed(1)}%</span>
            {metrics && (
              <span className="text-xs text-gray-400">
                {formatNumber(metrics.processedRows)}/{formatNumber(metrics.totalRows)}
              </span>
            )}
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(progress)}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          >
            {/* Animated progress shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Current Operation */}
      {metrics?.currentOperation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Cpu className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-blue-800">Current Operation</span>
          </div>
          <p className="text-sm text-blue-700 mt-1">{metrics.currentOperation}</p>
        </div>
      )}

      {/* Processing Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {/* Throughput */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className={`h-4 w-4 ${
                getThroughputTrend() === 'increasing' ? 'text-green-500' :
                getThroughputTrend() === 'decreasing' ? 'text-red-500' : 'text-blue-500'
              }`} />
              <span className="text-xs font-medium text-gray-600">Throughput</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {formatNumber(Math.round(metrics.rowsPerSecond))}
            </div>
            <div className="text-xs text-gray-500">rows/sec</div>
          </div>

          {/* Time Remaining */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs font-medium text-gray-600">ETA</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {metrics.estimatedTimeRemaining > 0 
                ? formatTime(metrics.estimatedTimeRemaining)
                : '--'
              }
            </div>
            <div className="text-xs text-gray-500">remaining</div>
          </div>

          {/* Elapsed Time */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="text-xs font-medium text-gray-600">Elapsed</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {formatTime(metrics.elapsedTime)}
            </div>
            <div className="text-xs text-gray-500">time</div>
          </div>

          {/* Memory Usage */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Cpu className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-gray-600">Memory</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {formatBytes(metrics.memoryUsage)}
            </div>
            <div className="text-xs text-gray-500">used</div>
          </div>
        </div>
      )}

      {/* Processing Stages */}
      {showDetailed && stages.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Processing Stages</h4>
          
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center space-x-3">
              {/* Stage Icon */}
              <div className="flex-shrink-0">
                {getStageIcon(stage)}
              </div>

              {/* Stage Content */}
              <div className="flex-grow min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${
                    stage.status === 'completed' ? 'text-green-700' :
                    stage.status === 'active' ? 'text-blue-700' :
                    stage.status === 'error' ? 'text-red-700' : 'text-gray-500'
                  }`}>
                    {stage.name}
                  </span>
                  
                  {stage.status === 'active' && (
                    <span className="text-xs text-gray-500">
                      {stage.progress.toFixed(1)}%
                    </span>
                  )}
                  
                  {stage.status === 'completed' && stage.startTime && stage.endTime && (
                    <span className="text-xs text-gray-500">
                      {formatTime(stage.endTime - stage.startTime)}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-gray-600 mb-2">{stage.description}</p>
                
                {/* Stage Progress Bar */}
                {stage.status === 'active' && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${stage.progress}%` }}
                    />
                  </div>
                )}
                
                {stage.status === 'completed' && (
                  <div className="w-full bg-green-200 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full w-full" />
                  </div>
                )}
                
                {stage.status === 'error' && (
                  <div className="w-full bg-red-200 rounded-full h-1.5">
                    <div className="bg-red-500 h-1.5 rounded-full w-full" />
                  </div>
                )}
              </div>

              {/* Connection Line */}
              {index < stages.length - 1 && (
                <div className="absolute left-6 mt-8 w-0.5 h-6 bg-gray-200" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Throughput History Chart */}
      {showDetailed && metrics?.throughputHistory && metrics.throughputHistory.length > 1 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <h5 className="text-xs font-medium text-gray-600 mb-2">Throughput Trend</h5>
          <div className="flex items-end space-x-1 h-12">
            {metrics.throughputHistory.slice(-20).map((value, index) => {
              const maxValue = Math.max(...metrics.throughputHistory);
              const height = (value / maxValue) * 100;
              
              return (
                <div
                  key={index}
                  className={`flex-1 rounded-t ${
                    index === metrics.throughputHistory.length - 1 
                      ? 'bg-blue-500' 
                      : 'bg-blue-300'
                  }`}
                  style={{ height: `${height}%` }}
                  title={`${Math.round(value)} rows/sec`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Past</span>
            <span>Current: {Math.round(metrics.rowsPerSecond)} rows/sec</span>
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {showDetailed && metrics && (
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <h5 className="text-xs font-medium text-gray-700 mb-2">Performance Insights</h5>
          <div className="space-y-1 text-xs text-gray-600">
            {metrics.rowsPerSecond > 1000 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Excellent processing speed</span>
              </div>
            )}
            
            {metrics.rowsPerSecond < 100 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span>Processing speed could be improved</span>
              </div>
            )}
            
            {metrics.memoryUsage > 100 * 1024 * 1024 && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full" />
                <span>High memory usage detected</span>
              </div>
            )}
            
            {getThroughputTrend() === 'increasing' && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>Throughput is improving</span>
              </div>
            )}
            
            {getThroughputTrend() === 'decreasing' && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span>Throughput is declining</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressIndicator;