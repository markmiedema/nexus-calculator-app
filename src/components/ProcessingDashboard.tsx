import React, { useState, useEffect } from 'react';
import DetailedProgressDisplay from './DetailedProgressDisplay';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { getStagesForStrategy, getStageWeights } from '../utils/progressStages';
import { Play, Pause, Square, Settings, BarChart3, Clock, Zap } from 'lucide-react';

interface ProcessingDashboardProps {
  strategy: 'chunked' | 'worker' | 'fallback' | 'standard';
  totalRows: number;
  isProcessing: boolean;
  onPause?: () => void;
  onResume?: () => void;
  onCancel?: () => void;
  onReset?: () => void;
  className?: string;
}

const ProcessingDashboard: React.FC<ProcessingDashboardProps> = ({
  strategy,
  totalRows,
  isProcessing,
  onPause,
  onResume,
  onCancel,
  onReset,
  className = ''
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const {
    stages,
    metrics,
    initializeTracking,
    startStage,
    updateStageProgress,
    completeStage,
    updateProcessedRows,
    resetTracking,
    getOverallProgress,
    getStagesSummary
  } = useProgressTracking({
    onStageChange: (stage) => {
      console.log(`Stage ${stage.name}: ${stage.status} (${stage.progress}%)`);
    },
    onMetricsUpdate: (metrics) => {
      // Optional: Log performance metrics
      if (metrics.rowsPerSecond > 0) {
        console.log(`Processing at ${Math.round(metrics.rowsPerSecond)} rows/second`);
      }
    }
  });

  // Initialize tracking when component mounts or strategy changes
  useEffect(() => {
    if (isProcessing && totalRows > 0) {
      const stageDefinitions = getStagesForStrategy(strategy);
      initializeTracking(totalRows, stageDefinitions);
      
      // Start first stage
      if (stageDefinitions.length > 0) {
        startStage(stageDefinitions[0].id);
      }
    }
  }, [strategy, totalRows, isProcessing, initializeTracking, startStage]);

  // Simulate processing progress (in real implementation, this would be driven by actual processing)
  useEffect(() => {
    if (!isProcessing || isPaused) return;

    const stageWeights = getStageWeights(strategy);
    const stageIds = Object.keys(stageWeights);
    let currentStageIndex = 0;
    let stageProgress = 0;

    const progressInterval = setInterval(() => {
      if (currentStageIndex >= stageIds.length) {
        clearInterval(progressInterval);
        return;
      }

      const currentStageId = stageIds[currentStageIndex];
      stageProgress += Math.random() * 5; // Simulate variable progress

      if (stageProgress >= 100) {
        // Complete current stage
        completeStage(currentStageId);
        currentStageIndex++;
        stageProgress = 0;

        // Start next stage
        if (currentStageIndex < stageIds.length) {
          startStage(stageIds[currentStageIndex]);
        }
      } else {
        // Update current stage progress
        updateStageProgress(currentStageId, stageProgress);
      }

      // Update processed rows based on overall progress
      const overallProgress = getOverallProgress();
      const processedRows = Math.floor((overallProgress / 100) * totalRows);
      updateProcessedRows(processedRows);
    }, 100);

    return () => clearInterval(progressInterval);
  }, [
    isProcessing,
    isPaused,
    strategy,
    totalRows,
    startStage,
    updateStageProgress,
    completeStage,
    updateProcessedRows,
    getOverallProgress
  ]);

  const handlePause = () => {
    setIsPaused(true);
    onPause?.();
  };

  const handleResume = () => {
    setIsPaused(false);
    onResume?.();
  };

  const handleCancel = () => {
    resetTracking();
    onCancel?.();
  };

  const handleReset = () => {
    resetTracking();
    setIsPaused(false);
    onReset?.();
  };

  const getStrategyInfo = () => {
    switch (strategy) {
      case 'chunked':
        return {
          name: 'Chunked Processing',
          description: 'Large dataset processed in parallel chunks using worker pool',
          icon: <BarChart3 className="h-5 w-5" />,
          color: 'text-purple-600'
        };
      case 'worker':
        return {
          name: 'Background Processing',
          description: 'Medium dataset processed in background using Web Worker',
          icon: <Zap className="h-5 w-5" />,
          color: 'text-blue-600'
        };
      case 'fallback':
        return {
          name: 'Main Thread Processing',
          description: 'Small dataset processed on main thread with progress updates',
          icon: <Clock className="h-5 w-5" />,
          color: 'text-green-600'
        };
      default:
        return {
          name: 'Standard Processing',
          description: 'Standard CSV processing with comprehensive analysis',
          icon: <Settings className="h-5 w-5" />,
          color: 'text-gray-600'
        };
    }
  };

  const strategyInfo = getStrategyInfo();
  const stagesSummary = getStagesSummary();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Strategy Information */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={strategyInfo.color}>
              {strategyInfo.icon}
            </div>
            <div>
              <h3 className="font-medium text-gray-800">{strategyInfo.name}</h3>
              <p className="text-sm text-gray-600">{strategyInfo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {totalRows.toLocaleString()} rows
            </span>
            
            {isProcessing && (
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-yellow-500' : 'bg-green-500 animate-pulse'}`} />
                <span className="text-xs text-gray-500">
                  {isPaused ? 'Paused' : 'Processing'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Progress Display */}
      <DetailedProgressDisplay
        title="SALT Nexus Analysis"
        subtitle={`Processing ${totalRows.toLocaleString()} rows using ${strategyInfo.name.toLowerCase()}`}
        showControls={isProcessing}
        onPause={handlePause}
        onResume={handleResume}
        onCancel={handleCancel}
        onReset={handleReset}
      />

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {Math.round(metrics.rowsPerSecond)}
            </div>
            <div className="text-xs text-gray-500 font-medium">Rows/Second</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {stagesSummary.completed}
            </div>
            <div className="text-xs text-gray-500 font-medium">Stages Complete</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {metrics.estimatedTimeRemaining > 0 
                ? `${Math.ceil(metrics.estimatedTimeRemaining / 1000)}s`
                : '--'
              }
            </div>
            <div className="text-xs text-gray-500 font-medium">Time Remaining</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {((metrics.processedRows / metrics.totalRows) * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500 font-medium">Data Processed</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingDashboard;