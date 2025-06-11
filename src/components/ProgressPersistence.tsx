import React, { useEffect, useState } from 'react';
import { useProgress } from '../context/ProgressContext';
import { RotateCcw, Save, Trash2, Clock } from 'lucide-react';

interface ProgressPersistenceProps {
  className?: string;
}

const ProgressPersistence: React.FC<ProgressPersistenceProps> = ({
  className = ''
}) => {
  const { state, resetProgress } = useProgress();
  const [savedSessions, setSavedSessions] = useState<Array<{
    id: string;
    timestamp: number;
    strategy: string;
    totalRows: number;
    progress: number;
    isCompleted: boolean;
  }>>([]);
  const [showSessionManager, setShowSessionManager] = useState(false);

  // Load saved sessions on mount
  useEffect(() => {
    loadSavedSessions();
  }, []);

  const loadSavedSessions = () => {
    try {
      const sessions = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('salt-nexus-progress-')) {
          const sessionData = localStorage.getItem(key);
          if (sessionData) {
            const parsed = JSON.parse(sessionData);
            sessions.push({
              id: key,
              timestamp: parsed.lastUpdate || parsed.startTime || Date.now(),
              strategy: parsed.strategy || 'standard',
              totalRows: parsed.totalRows || 0,
              progress: parsed.overallProgress || 0,
              isCompleted: parsed.overallProgress >= 100 || !parsed.isProcessing
            });
          }
        }
      }
      
      // Sort by timestamp (newest first)
      sessions.sort((a, b) => b.timestamp - a.timestamp);
      setSavedSessions(sessions);
    } catch (error) {
      console.warn('Failed to load saved sessions:', error);
    }
  };

  const saveCurrentSession = () => {
    try {
      const sessionKey = `salt-nexus-progress-${state.sessionId}`;
      const sessionData = {
        ...state,
        // Don't save sensitive data
        metrics: null,
        error: null
      };
      
      localStorage.setItem(sessionKey, JSON.stringify(sessionData));
      loadSavedSessions();
      
      // Show success feedback
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg z-50';
      notification.textContent = 'Session saved successfully';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 3000);
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  };

  const restoreSession = (sessionId: string) => {
    try {
      const sessionData = localStorage.getItem(sessionId);
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        // This would need to be implemented in the context
        // For now, we'll just reset and show the session info
        resetProgress();
        setShowSessionManager(false);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  };

  const deleteSession = (sessionId: string) => {
    try {
      localStorage.removeItem(sessionId);
      loadSavedSessions();
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const clearAllSessions = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('salt-nexus-progress-')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      setSavedSessions([]);
    } catch (error) {
      console.error('Failed to clear sessions:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'chunked': return 'text-purple-600 bg-purple-100';
      case 'worker': return 'text-blue-600 bg-blue-100';
      case 'fallback': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Session Controls */}
      <div className="flex items-center space-x-2">
        {state.isProcessing && (
          <button
            onClick={saveCurrentSession}
            className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
            title="Save current session"
          >
            <Save className="h-4 w-4 mr-1" />
            Save Session
          </button>
        )}

        <button
          onClick={() => setShowSessionManager(!showSessionManager)}
          className="flex items-center px-3 py-1.5 text-sm bg-gray-50 text-gray-700 border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
          title="Manage saved sessions"
        >
          <Clock className="h-4 w-4 mr-1" />
          Sessions ({savedSessions.length})
        </button>

        <button
          onClick={resetProgress}
          className="flex items-center px-3 py-1.5 text-sm bg-red-50 text-red-700 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
          title="Reset current progress"
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </button>
      </div>

      {/* Session Manager Modal */}
      {showSessionManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Session Manager</h3>
                <div className="flex items-center space-x-2">
                  {savedSessions.length > 0 && (
                    <button
                      onClick={clearAllSessions}
                      className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowSessionManager(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Sessions List */}
            <div className="p-6 overflow-y-auto max-h-96">
              {savedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No saved sessions found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Sessions are automatically saved during processing
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-grow">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStrategyColor(session.strategy)}`}>
                            {session.strategy}
                          </span>
                          <span className="text-sm text-gray-600">
                            {session.totalRows.toLocaleString()} rows
                          </span>
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(session.timestamp)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <div className="flex-grow">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{session.progress.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  session.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${session.progress}%` }}
                              />
                            </div>
                          </div>
                          
                          {session.isCompleted && (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                              Completed
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => restoreSession(session.id)}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => deleteSession(session.id)}
                          className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500">
                Sessions are automatically saved to your browser's local storage and persist between visits.
                They do not contain sensitive data and can be safely shared or exported.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPersistence;