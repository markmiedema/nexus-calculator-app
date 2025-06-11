import React, { useEffect, useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react';

interface ProgressTransitionsProps {
  children: React.ReactNode;
  className?: string;
}

const ProgressTransitions: React.FC<ProgressTransitionsProps> = ({
  children,
  className = ''
}) => {
  const { state } = useProgress();
  const [previousState, setPreviousState] = useState(state);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionType, setTransitionType] = useState<'start' | 'complete' | 'error' | 'pause' | null>(null);

  useEffect(() => {
    // Detect state transitions
    if (state.isProcessing !== previousState.isProcessing) {
      if (state.isProcessing) {
        setTransitionType('start');
        setShowTransition(true);
      } else if (state.overallProgress >= 100) {
        setTransitionType('complete');
        setShowTransition(true);
      }
    }

    if (state.isPaused !== previousState.isPaused && state.isPaused) {
      setTransitionType('pause');
      setShowTransition(true);
    }

    if (state.error && !previousState.error) {
      setTransitionType('error');
      setShowTransition(true);
    }

    setPreviousState(state);

    // Auto-hide transition after animation
    if (showTransition) {
      const timer = setTimeout(() => {
        setShowTransition(false);
        setTransitionType(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, previousState, showTransition]);

  const getTransitionContent = () => {
    switch (transitionType) {
      case 'start':
        return {
          icon: <Zap className="h-8 w-8 text-blue-500" />,
          title: 'Processing Started',
          message: `Analyzing ${state.totalRows.toLocaleString()} rows using ${state.strategy} processing`,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'complete':
        return {
          icon: <CheckCircle className="h-8 w-8 text-green-500" />,
          title: 'Processing Complete',
          message: 'Your SALT nexus analysis is ready for review',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'error':
        return {
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          title: 'Processing Error',
          message: state.error || 'An unexpected error occurred',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pause':
        return {
          icon: <Clock className="h-8 w-8 text-yellow-500" />,
          title: 'Processing Paused',
          message: 'Processing has been paused and can be resumed at any time',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
      default:
        return null;
    }
  };

  const transitionContent = getTransitionContent();

  return (
    <div className={`relative ${className}`}>
      {/* Main Content */}
      <div
        className={`transition-all duration-500 ${
          showTransition && state.animationsEnabled
            ? 'transform scale-95 opacity-75 blur-sm'
            : 'transform scale-100 opacity-100 blur-0'
        }`}
      >
        {children}
      </div>

      {/* Transition Overlay */}
      {showTransition && transitionContent && state.animationsEnabled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
          <div
            className={`
              max-w-md mx-4 p-6 rounded-lg shadow-xl border-2 
              ${transitionContent.bgColor} ${transitionContent.borderColor}
              transform transition-all duration-500 ease-out
              animate-in slide-in-from-bottom-4 fade-in-0
            `}
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0 animate-pulse">
                {transitionContent.icon}
              </div>
              <div className="flex-grow">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {transitionContent.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {transitionContent.message}
                </p>
              </div>
            </div>

            {/* Progress indicator for ongoing processing */}
            {(transitionType === 'start' || transitionType === 'pause') && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Overall Progress</span>
                  <span>{state.overallProgress.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${state.overallProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Auto-dismiss indicator */}
            <div className="mt-4 flex justify-center">
              <div className="flex space-x-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stage Transition Notifications */}
      {state.animationsEnabled && (
        <StageTransitionNotifications />
      )}
    </div>
  );
};

// Component for stage-specific transition notifications
const StageTransitionNotifications: React.FC = () => {
  const { state } = useProgress();
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    stage: string;
    type: 'start' | 'complete';
    timestamp: number;
  }>>([]);

  useEffect(() => {
    // Track stage transitions
    const activeStage = state.stages.find(s => s.status === 'active');
    const completedStages = state.stages.filter(s => s.status === 'completed');

    // Add notifications for new active stages
    if (activeStage) {
      const existingNotification = notifications.find(
        n => n.stage === activeStage.id && n.type === 'start'
      );
      
      if (!existingNotification) {
        const newNotification = {
          id: `${activeStage.id}-start-${Date.now()}`,
          stage: activeStage.name,
          type: 'start' as const,
          timestamp: Date.now()
        };
        
        setNotifications(prev => [...prev, newNotification]);
      }
    }

    // Add notifications for newly completed stages
    completedStages.forEach(stage => {
      const existingNotification = notifications.find(
        n => n.stage === stage.id && n.type === 'complete'
      );
      
      if (!existingNotification && stage.endTime) {
        const newNotification = {
          id: `${stage.id}-complete-${Date.now()}`,
          stage: stage.name,
          type: 'complete' as const,
          timestamp: stage.endTime
        };
        
        setNotifications(prev => [...prev, newNotification]);
      }
    });

    // Clean up old notifications
    const cutoff = Date.now() - 5000; // 5 seconds
    setNotifications(prev => prev.filter(n => n.timestamp > cutoff));
  }, [state.stages, notifications]);

  return (
    <div className="fixed top-4 right-4 z-40 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            px-4 py-2 rounded-lg shadow-lg border
            transform transition-all duration-500 ease-out
            animate-in slide-in-from-right-4 fade-in-0
            ${notification.type === 'complete'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
            }
          `}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'complete' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">
              {notification.type === 'complete' ? 'Completed:' : 'Started:'} {notification.stage}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressTransitions;