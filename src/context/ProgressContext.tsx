import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import { ProcessingStage, ProcessingMetrics } from '../components/ProgressIndicator';

// Progress State Types
export interface ProgressState {
  // Current processing state
  isProcessing: boolean;
  isPaused: boolean;
  isCancelled: boolean;
  
  // Progress data
  overallProgress: number;
  currentStageId: string | null;
  stages: ProcessingStage[];
  metrics: ProcessingMetrics | null;
  
  // Processing metadata
  strategy: 'chunked' | 'worker' | 'fallback' | 'standard';
  totalRows: number;
  processedRows: number;
  startTime: number | null;
  endTime: number | null;
  
  // Error handling
  error: string | null;
  warnings: string[];
  
  // UI state
  showDetailed: boolean;
  animationsEnabled: boolean;
  
  // Persistence
  sessionId: string;
  lastUpdate: number;
}

// Progress Actions
type ProgressAction =
  | { type: 'INITIALIZE_PROCESSING'; payload: { strategy: string; totalRows: number; stages: Omit<ProcessingStage, 'progress' | 'status'>[] } }
  | { type: 'START_PROCESSING' }
  | { type: 'PAUSE_PROCESSING' }
  | { type: 'RESUME_PROCESSING' }
  | { type: 'CANCEL_PROCESSING' }
  | { type: 'COMPLETE_PROCESSING' }
  | { type: 'UPDATE_OVERALL_PROGRESS'; payload: { progress: number } }
  | { type: 'START_STAGE'; payload: { stageId: string } }
  | { type: 'UPDATE_STAGE_PROGRESS'; payload: { stageId: string; progress: number } }
  | { type: 'COMPLETE_STAGE'; payload: { stageId: string } }
  | { type: 'ERROR_STAGE'; payload: { stageId: string; error: string } }
  | { type: 'UPDATE_METRICS'; payload: { metrics: ProcessingMetrics } }
  | { type: 'UPDATE_PROCESSED_ROWS'; payload: { count: number } }
  | { type: 'ADD_WARNING'; payload: { warning: string } }
  | { type: 'SET_ERROR'; payload: { error: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'TOGGLE_DETAILED_VIEW' }
  | { type: 'TOGGLE_ANIMATIONS' }
  | { type: 'RESET_PROGRESS' }
  | { type: 'RESTORE_STATE'; payload: { state: Partial<ProgressState> } };

// Context Type
interface ProgressContextType {
  state: ProgressState;
  dispatch: React.Dispatch<ProgressAction>;
  
  // Convenience methods
  initializeProcessing: (strategy: string, totalRows: number, stages: Omit<ProcessingStage, 'progress' | 'status'>[]) => void;
  startProcessing: () => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  cancelProcessing: () => void;
  completeProcessing: () => void;
  updateOverallProgress: (progress: number) => void;
  startStage: (stageId: string) => void;
  updateStageProgress: (stageId: string, progress: number) => void;
  completeStage: (stageId: string) => void;
  errorStage: (stageId: string, error: string) => void;
  updateMetrics: (metrics: ProcessingMetrics) => void;
  updateProcessedRows: (count: number) => void;
  addWarning: (warning: string) => void;
  setError: (error: string) => void;
  clearError: () => void;
  toggleDetailedView: () => void;
  toggleAnimations: () => void;
  resetProgress: () => void;
  
  // Computed values
  getActiveStage: () => ProcessingStage | null;
  getCompletedStages: () => ProcessingStage[];
  getProcessingDuration: () => number;
  getEstimatedCompletion: () => Date | null;
  canPause: () => boolean;
  canResume: () => boolean;
  canCancel: () => boolean;
}

// Initial State
const initialState: ProgressState = {
  isProcessing: false,
  isPaused: false,
  isCancelled: false,
  overallProgress: 0,
  currentStageId: null,
  stages: [],
  metrics: null,
  strategy: 'standard',
  totalRows: 0,
  processedRows: 0,
  startTime: null,
  endTime: null,
  error: null,
  warnings: [],
  showDetailed: false,
  animationsEnabled: true,
  sessionId: generateSessionId(),
  lastUpdate: Date.now()
};

// Session ID generator
function generateSessionId(): string {
  return `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Progress Reducer
function progressReducer(state: ProgressState, action: ProgressAction): ProgressState {
  const now = Date.now();
  
  switch (action.type) {
    case 'INITIALIZE_PROCESSING':
      return {
        ...state,
        strategy: action.payload.strategy as any,
        totalRows: action.payload.totalRows,
        stages: action.payload.stages.map(stage => ({
          ...stage,
          progress: 0,
          status: 'pending'
        })),
        processedRows: 0,
        overallProgress: 0,
        currentStageId: null,
        error: null,
        warnings: [],
        lastUpdate: now
      };

    case 'START_PROCESSING':
      return {
        ...state,
        isProcessing: true,
        isPaused: false,
        isCancelled: false,
        startTime: now,
        endTime: null,
        error: null,
        sessionId: generateSessionId(),
        lastUpdate: now
      };

    case 'PAUSE_PROCESSING':
      return {
        ...state,
        isPaused: true,
        lastUpdate: now
      };

    case 'RESUME_PROCESSING':
      return {
        ...state,
        isPaused: false,
        lastUpdate: now
      };

    case 'CANCEL_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        isPaused: false,
        isCancelled: true,
        endTime: now,
        currentStageId: null,
        lastUpdate: now
      };

    case 'COMPLETE_PROCESSING':
      return {
        ...state,
        isProcessing: false,
        isPaused: false,
        overallProgress: 100,
        endTime: now,
        currentStageId: null,
        stages: state.stages.map(stage => ({
          ...stage,
          status: stage.status === 'active' ? 'completed' : stage.status,
          progress: stage.status === 'active' ? 100 : stage.progress,
          endTime: stage.status === 'active' ? now : stage.endTime
        })),
        lastUpdate: now
      };

    case 'UPDATE_OVERALL_PROGRESS':
      return {
        ...state,
        overallProgress: Math.min(100, Math.max(0, action.payload.progress)),
        lastUpdate: now
      };

    case 'START_STAGE':
      return {
        ...state,
        currentStageId: action.payload.stageId,
        stages: state.stages.map(stage => {
          if (stage.id === action.payload.stageId) {
            return {
              ...stage,
              status: 'active',
              progress: 0,
              startTime: now
            };
          }
          return stage;
        }),
        lastUpdate: now
      };

    case 'UPDATE_STAGE_PROGRESS':
      return {
        ...state,
        stages: state.stages.map(stage => {
          if (stage.id === action.payload.stageId && stage.status === 'active') {
            return {
              ...stage,
              progress: Math.min(100, Math.max(0, action.payload.progress))
            };
          }
          return stage;
        }),
        lastUpdate: now
      };

    case 'COMPLETE_STAGE':
      return {
        ...state,
        stages: state.stages.map(stage => {
          if (stage.id === action.payload.stageId) {
            return {
              ...stage,
              status: 'completed',
              progress: 100,
              endTime: now
            };
          }
          return stage;
        }),
        currentStageId: state.currentStageId === action.payload.stageId ? null : state.currentStageId,
        lastUpdate: now
      };

    case 'ERROR_STAGE':
      return {
        ...state,
        stages: state.stages.map(stage => {
          if (stage.id === action.payload.stageId) {
            return {
              ...stage,
              status: 'error',
              endTime: now
            };
          }
          return stage;
        }),
        error: action.payload.error,
        isProcessing: false,
        currentStageId: null,
        lastUpdate: now
      };

    case 'UPDATE_METRICS':
      return {
        ...state,
        metrics: action.payload.metrics,
        lastUpdate: now
      };

    case 'UPDATE_PROCESSED_ROWS':
      return {
        ...state,
        processedRows: Math.min(state.totalRows, Math.max(0, action.payload.count)),
        lastUpdate: now
      };

    case 'ADD_WARNING':
      return {
        ...state,
        warnings: [...state.warnings, action.payload.warning],
        lastUpdate: now
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload.error,
        isProcessing: false,
        isPaused: false,
        lastUpdate: now
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
        lastUpdate: now
      };

    case 'TOGGLE_DETAILED_VIEW':
      return {
        ...state,
        showDetailed: !state.showDetailed,
        lastUpdate: now
      };

    case 'TOGGLE_ANIMATIONS':
      return {
        ...state,
        animationsEnabled: !state.animationsEnabled,
        lastUpdate: now
      };

    case 'RESET_PROGRESS':
      return {
        ...initialState,
        animationsEnabled: state.animationsEnabled,
        showDetailed: state.showDetailed,
        sessionId: generateSessionId()
      };

    case 'RESTORE_STATE':
      return {
        ...state,
        ...action.payload.state,
        lastUpdate: now
      };

    default:
      return state;
  }
}

// Progress Context
const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

// Progress Provider Props
interface ProgressProviderProps {
  children: ReactNode;
  persistKey?: string;
  enablePersistence?: boolean;
}

// Progress Provider Component
export const ProgressProvider: React.FC<ProgressProviderProps> = ({
  children,
  persistKey = 'salt-nexus-progress',
  enablePersistence = true
}) => {
  const [state, dispatch] = useReducer(progressReducer, initialState);

  // Persistence: Save state to localStorage
  useEffect(() => {
    if (!enablePersistence) return;

    const saveState = () => {
      try {
        const stateToSave = {
          ...state,
          // Don't persist sensitive or temporary data
          metrics: null,
          error: null,
          warnings: []
        };
        localStorage.setItem(persistKey, JSON.stringify(stateToSave));
      } catch (error) {
        console.warn('Failed to save progress state:', error);
      }
    };

    // Debounce saves to avoid excessive localStorage writes
    const timeoutId = setTimeout(saveState, 500);
    return () => clearTimeout(timeoutId);
  }, [state, persistKey, enablePersistence]);

  // Persistence: Restore state from localStorage on mount
  useEffect(() => {
    if (!enablePersistence) return;

    try {
      const savedState = localStorage.getItem(persistKey);
      if (savedState) {
        const parsedState = JSON.parse(savedState);
        // Only restore if it's a recent session (within 1 hour)
        if (Date.now() - parsedState.lastUpdate < 3600000) {
          dispatch({ type: 'RESTORE_STATE', payload: { state: parsedState } });
        }
      }
    } catch (error) {
      console.warn('Failed to restore progress state:', error);
    }
  }, [persistKey, enablePersistence]);

  // Convenience methods
  const initializeProcessing = useCallback((strategy: string, totalRows: number, stages: Omit<ProcessingStage, 'progress' | 'status'>[]) => {
    dispatch({ type: 'INITIALIZE_PROCESSING', payload: { strategy, totalRows, stages } });
  }, []);

  const startProcessing = useCallback(() => {
    dispatch({ type: 'START_PROCESSING' });
  }, []);

  const pauseProcessing = useCallback(() => {
    dispatch({ type: 'PAUSE_PROCESSING' });
  }, []);

  const resumeProcessing = useCallback(() => {
    dispatch({ type: 'RESUME_PROCESSING' });
  }, []);

  const cancelProcessing = useCallback(() => {
    dispatch({ type: 'CANCEL_PROCESSING' });
  }, []);

  const completeProcessing = useCallback(() => {
    dispatch({ type: 'COMPLETE_PROCESSING' });
  }, []);

  const updateOverallProgress = useCallback((progress: number) => {
    dispatch({ type: 'UPDATE_OVERALL_PROGRESS', payload: { progress } });
  }, []);

  const startStage = useCallback((stageId: string) => {
    dispatch({ type: 'START_STAGE', payload: { stageId } });
  }, []);

  const updateStageProgress = useCallback((stageId: string, progress: number) => {
    dispatch({ type: 'UPDATE_STAGE_PROGRESS', payload: { stageId, progress } });
  }, []);

  const completeStage = useCallback((stageId: string) => {
    dispatch({ type: 'COMPLETE_STAGE', payload: { stageId } });
  }, []);

  const errorStage = useCallback((stageId: string, error: string) => {
    dispatch({ type: 'ERROR_STAGE', payload: { stageId, error } });
  }, []);

  const updateMetrics = useCallback((metrics: ProcessingMetrics) => {
    dispatch({ type: 'UPDATE_METRICS', payload: { metrics } });
  }, []);

  const updateProcessedRows = useCallback((count: number) => {
    dispatch({ type: 'UPDATE_PROCESSED_ROWS', payload: { count } });
  }, []);

  const addWarning = useCallback((warning: string) => {
    dispatch({ type: 'ADD_WARNING', payload: { warning } });
  }, []);

  const setError = useCallback((error: string) => {
    dispatch({ type: 'SET_ERROR', payload: { error } });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const toggleDetailedView = useCallback(() => {
    dispatch({ type: 'TOGGLE_DETAILED_VIEW' });
  }, []);

  const toggleAnimations = useCallback(() => {
    dispatch({ type: 'TOGGLE_ANIMATIONS' });
  }, []);

  const resetProgress = useCallback(() => {
    dispatch({ type: 'RESET_PROGRESS' });
  }, []);

  // Computed values
  const getActiveStage = useCallback((): ProcessingStage | null => {
    return state.stages.find(stage => stage.status === 'active') || null;
  }, [state.stages]);

  const getCompletedStages = useCallback((): ProcessingStage[] => {
    return state.stages.filter(stage => stage.status === 'completed');
  }, [state.stages]);

  const getProcessingDuration = useCallback((): number => {
    if (!state.startTime) return 0;
    const endTime = state.endTime || Date.now();
    return endTime - state.startTime;
  }, [state.startTime, state.endTime]);

  const getEstimatedCompletion = useCallback((): Date | null => {
    if (!state.metrics?.estimatedTimeRemaining || state.metrics.estimatedTimeRemaining <= 0) {
      return null;
    }
    return new Date(Date.now() + state.metrics.estimatedTimeRemaining);
  }, [state.metrics]);

  const canPause = useCallback((): boolean => {
    return state.isProcessing && !state.isPaused && !state.isCancelled;
  }, [state.isProcessing, state.isPaused, state.isCancelled]);

  const canResume = useCallback((): boolean => {
    return state.isProcessing && state.isPaused && !state.isCancelled;
  }, [state.isProcessing, state.isPaused, state.isCancelled]);

  const canCancel = useCallback((): boolean => {
    return state.isProcessing && !state.isCancelled;
  }, [state.isProcessing, state.isCancelled]);

  const contextValue: ProgressContextType = {
    state,
    dispatch,
    initializeProcessing,
    startProcessing,
    pauseProcessing,
    resumeProcessing,
    cancelProcessing,
    completeProcessing,
    updateOverallProgress,
    startStage,
    updateStageProgress,
    completeStage,
    errorStage,
    updateMetrics,
    updateProcessedRows,
    addWarning,
    setError,
    clearError,
    toggleDetailedView,
    toggleAnimations,
    resetProgress,
    getActiveStage,
    getCompletedStages,
    getProcessingDuration,
    getEstimatedCompletion,
    canPause,
    canResume,
    canCancel
  };

  return (
    <ProgressContext.Provider value={contextValue}>
      {children}
    </ProgressContext.Provider>
  );
};

// Custom hook to use progress context
export const useProgress = (): ProgressContextType => {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

// Optimistic progress hook for smooth updates
export const useOptimisticProgress = () => {
  const { state, updateOverallProgress, updateStageProgress } = useProgress();
  
  const optimisticUpdateProgress = useCallback((targetProgress: number, duration: number = 1000) => {
    const startProgress = state.overallProgress;
    const progressDiff = targetProgress - startProgress;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(progress);
      
      const currentProgress = startProgress + (progressDiff * easedProgress);
      updateOverallProgress(currentProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    if (state.animationsEnabled) {
      requestAnimationFrame(animate);
    } else {
      updateOverallProgress(targetProgress);
    }
  }, [state.overallProgress, state.animationsEnabled, updateOverallProgress]);

  const optimisticUpdateStageProgress = useCallback((stageId: string, targetProgress: number, duration: number = 500) => {
    const stage = state.stages.find(s => s.id === stageId);
    if (!stage) return;
    
    const startProgress = stage.progress;
    const progressDiff = targetProgress - startProgress;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);
      const easedProgress = easeOutQuad(progress);
      
      const currentProgress = startProgress + (progressDiff * easedProgress);
      updateStageProgress(stageId, currentProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    if (state.animationsEnabled) {
      requestAnimationFrame(animate);
    } else {
      updateStageProgress(stageId, targetProgress);
    }
  }, [state.stages, state.animationsEnabled, updateStageProgress]);

  return {
    optimisticUpdateProgress,
    optimisticUpdateStageProgress
  };
};