import React from 'react';
import { useProgress, useOptimisticProgress } from '../context/ProgressContext';
import AnimatedProgressBar from './AnimatedProgressBar';
import ProgressTransitions from './ProgressTransitions';
import ProgressPersistence from './ProgressPersistence';
import { ProcessingStage, ProcessingMetrics } from './ProgressIndicator';
import { 
  Clock, 
  Zap, 
  BarChart3, 
  Cpu, 
  CheckCircle, 
  Loader, 
  AlertCircle,
  Settings,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square
} from 'lucide-react';

interface EnhancedProgressIndicatorProps {
  className?: string;
  showControls?: boolean;
  showPersistence?: boolean;
  compact?: boolean;
}

const EnhancedProgressIndicator: React.FC<EnhancedProgressIndicatorProps> = ({
  className = '',
  showControls = true,
  showPersistence = true,
  compact = false
}) => {
  const {
    state,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
    toggleDetailedView,
    toggleAnimations,
    getActiveStage,
    getProcessingDuration,
    getEstimatedCompletion,
    canPause,
    canResume,
    canCancel
  } = useProgress();

  const { optimisticUpdateProgress } = useOptimisticProgress();

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

  const activeStage = getActiveStage();
  const processingDuration = getProcessingDuration();
  const estimatedCompletion = getEstimatedCompletion();

  if (!state.isProcessing && state.overallProgress === 0 && !state.error) {
    return null;
  }

  return (
    <ProgressTransitions className={className}>
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {state.error ? (
                  <AlertCircle className="h-6 w-6 text-red-500" />
                ) : state.isProcessing ? (
                  <Loader className="h-6 w-6 text-blue-500 animate-spin" />
                ) : state.overallProgress >= 100 ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-gray-400" />
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {state.error ? 'Processing Error' :
                   state.isProcessing ? 'Processing Data' :
                   state.overallProgress >= 100 ? 'Processing Complete' :
                   'Processing Paused'}
                </h3>
                
                <p className="text-sm text-gray-600">
                  {activeStage ? activeStage.description : 
                   state.error ? state.error :
                   `${state.totalRows.toLocaleString()} rows using ${state.strategy} processing`}
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              {showControls && (
                <>
                  {canPause() && (
                    <button
                      onClick={pauseProcessing}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Pause processing"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                  )}
                  
                  {canResume() && (
                    <button
                      onClick={resumeProcessing}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                      title="Resume processing"
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  )}
                  
                  {canCancel() && (
                    <button
                      onClick={cancelProcessing}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Cancel processing"
                    >
                      <Square className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}

              <button
                onClick={toggleDetailedView}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title={state.showDetailed ? "Hide details" : "Show details"}
              >
                {state.showDetailed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>

              <button
                onClick={toggleAnimations}
                className={`p-2 rounded-md transition-colors ${
                  state.animationsEnabled 
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
                title={state.animationsEnabled ? "Disable animations" : "Enable animations"}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Progress Content */}
        <div className="p-6">
          {/* Main Progress Bar */}
          <div className="mb-6">
            <AnimatedProgressBar
              progress={state.overallProgress}
              height={12}
              showPercentage={true}
              showGlow={true}
              color={state.error ? 'red' : state.overallProgress >= 100 ? 'green' : 'blue'}
            />
          </div>

          {/* Current Stage */}
          {activeStage && !compact && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-blue-800">{activeStage.name}</h4>
                <span className="text-sm text-blue-600">{activeStage.progress.toFixed(1)}%</span>
              </div>
              <p className="text-blue-700 text-sm mb-3">{activeStage.description}</p>
              <AnimatedProgressBar
                progress={activeStage.progress}
                height={6}
                showPercentage={false}
                color="blue"
              />
            </div>
          )}

          {/* Metrics Grid */}
          {state.metrics && !compact && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Zap className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600">Throughput</span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {Math.round(state.metrics.rowsPerSecond)}
                </div>
                <div className="text-xs text-gray-500">rows/sec</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Clock className="h-4 w-4 text-orange-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600">ETA</span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {state.metrics.estimatedTimeRemaining > 0 
                    ? formatTime(state.metrics.estimatedTimeRemaining)
                    : '--'
                  }
                </div>
                <div className="text-xs text-gray-500">remaining</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-4 w-4 text-purple-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600">Elapsed</span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {formatTime(processingDuration)}
                </div>
                <div className="text-xs text-gray-500">time</div>
              </div>

              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-center mb-2">
                  <Cpu className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-xs font-medium text-gray-600">Memory</span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {formatBytes(state.metrics.memoryUsage)}
                </div>
                <div className="text-xs text-gray-500">used</div>
              </div>
            </div>
          )}

          {/* Detailed Stages View */}
          {state.showDetailed && !compact && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium text-gray-700 mb-3">Processing Stages</h5>
              
              {state.stages.map((stage, index) => (
                <div key={stage.id} className="flex items-center space-x-3">
                  {/* Stage Icon */}
                  <div className="flex-shrink-0">
                    {stage.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : stage.status === 'active' ? (
                      <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                    ) : stage.status === 'error' ? (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
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
                      <AnimatedProgressBar
                        progress={stage.progress}
                        height={4}
                        showPercentage={false}
                        color="blue"
                      />
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
                </div>
              ))}
            </div>
          )}

          {/* Warnings */}
          {state.warnings.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h5 className="text-sm font-medium text-yellow-800 mb-2">Warnings</h5>
              <ul className="text-sm text-yellow-700 space-y-1">
                {state.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Session Persistence */}
          {showPersistence && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <ProgressPersistence />
            </div>
          )}
        </div>
      </div>
    </ProgressTransitions>
  );
};

export default EnhancedProgressIndicator;