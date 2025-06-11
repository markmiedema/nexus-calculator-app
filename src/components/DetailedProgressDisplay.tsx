import React from 'react';
import ProgressIndicator, { ProcessingStage, ProcessingMetrics } from './ProgressIndicator';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { Play, Pause, Square, RotateCcw, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DetailedProgressDisplayProps {
  title?: string;
  subtitle?: string;
  showControls?: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  className?: string;
}

const DetailedProgressDisplay: React.FC<DetailedProgressDisplayProps> = ({
  title = "Processing Data",
  subtitle = "Analyzing your sales data for SALT nexus compliance",
  showControls = false,
  onPause,
  onResume,
  onCancel,
  onReset,
  className = ''
}) => {
  const {
    stages,
    metrics,
    currentStageId,
    getOverallProgress,
    getStagesSummary
  } = useProgressTracking();

  const overallProgress = getOverallProgress();
  const stagesSummary = getStagesSummary();

  const getCurrentStage = () => {
    return stages.find(stage => stage.id === currentStageId);
  };

  const getPerformanceIndicator = () => {
    if (!metrics?.throughputHistory || metrics.throughputHistory.length < 2) {
      return { icon: <Minus className="h-4 w-4" />, color: 'text-gray-500', label: 'Stable' };
    }

    const recent = metrics.throughputHistory.slice(-3);
    const average = recent.reduce((sum, val) => sum + val, 0) / recent.length;
    const latest = recent[recent.length - 1];

    if (latest > average * 1.1) {
      return { icon: <TrendingUp className="h-4 w-4" />, color: 'text-green-500', label: 'Improving' };
    }
    if (latest < average * 0.9) {
      return { icon: <TrendingDown className="h-4 w-4" />, color: 'text-red-500', label: 'Declining' };
    }
    return { icon: <Minus className="h-4 w-4" />, color: 'text-blue-500', label: 'Stable' };
  };

  const currentStage = getCurrentStage();
  const performanceIndicator = getPerformanceIndicator();

  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          </div>
          
          {/* Controls */}
          {showControls && (
            <div className="flex items-center space-x-2">
              <button
                onClick={onPause}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Pause processing"
              >
                <Pause className="h-4 w-4" />
              </button>
              
              <button
                onClick={onResume}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Resume processing"
              >
                <Play className="h-4 w-4" />
              </button>
              
              <button
                onClick={onCancel}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Cancel processing"
              >
                <Square className="h-4 w-4" />
              </button>
              
              <button
                onClick={onReset}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Reset progress"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Progress Content */}
      <div className="p-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {overallProgress.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600 font-medium">Overall Progress</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {stagesSummary.completed}
            </div>
            <div className="text-xs text-green-600 font-medium">Stages Complete</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">
              {stagesSummary.active}
            </div>
            <div className="text-xs text-orange-600 font-medium">Active Stages</div>
          </div>
          
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center space-x-1">
              <div className={`${performanceIndicator.color}`}>
                {performanceIndicator.icon}
              </div>
              <div className={`text-lg font-bold ${performanceIndicator.color}`}>
                {performanceIndicator.label}
              </div>
            </div>
            <div className="text-xs text-gray-600 font-medium">Performance</div>
          </div>
        </div>

        {/* Current Stage Highlight */}
        {currentStage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-800">Currently Processing</h4>
              <span className="text-sm text-blue-600">{currentStage.progress.toFixed(1)}%</span>
            </div>
            <p className="text-blue-700 text-sm mb-3">{currentStage.description}</p>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${currentStage.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Enhanced Progress Indicator */}
        <ProgressIndicator
          progress={overallProgress}
          message={currentStage ? currentStage.name : "Processing..."}
          stages={stages}
          metrics={metrics || undefined}
          showDetailed={true}
        />

        {/* Processing Insights */}
        {metrics && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Processing Insights</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Average Processing Speed:</span>
                <span className="ml-2 font-medium text-gray-800">
                  {Math.round(metrics.rowsPerSecond)} rows/second
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Estimated Completion:</span>
                <span className="ml-2 font-medium text-gray-800">
                  {metrics.estimatedTimeRemaining > 0 
                    ? new Date(Date.now() + metrics.estimatedTimeRemaining).toLocaleTimeString()
                    : 'Calculating...'
                  }
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Data Processed:</span>
                <span className="ml-2 font-medium text-gray-800">
                  {((metrics.processedRows / metrics.totalRows) * 100).toFixed(1)}% of {metrics.totalRows.toLocaleString()} rows
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Memory Usage:</span>
                <span className="ml-2 font-medium text-gray-800">
                  {(metrics.memoryUsage / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailedProgressDisplay;