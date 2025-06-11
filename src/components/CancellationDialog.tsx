import React, { useState } from 'react';
import { AlertTriangle, X, Square, Clock } from 'lucide-react';

interface CancellationDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  processingStats?: {
    totalRows: number;
    processedRows: number;
    elapsedTime: number;
    estimatedTimeRemaining: number;
  };
}

const CancellationDialog: React.FC<CancellationDialogProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  processingStats
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsConfirming(true);
    setTimeout(() => {
      onConfirm();
      setIsConfirming(false);
    }, 500);
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getProgressPercentage = () => {
    if (!processingStats) return 0;
    return (processingStats.processedRows / processingStats.totalRows) * 100;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">Cancel Processing?</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          <p className="text-gray-600 mb-4">
            Are you sure you want to cancel the current processing operation? 
            This action cannot be undone and you'll lose all progress.
          </p>

          {/* Processing Statistics */}
          {processingStats && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Current Progress</h4>
              
              <div className="space-y-3">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Data Processed</span>
                    <span>{getProgressPercentage().toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Processed:</span>
                    <div className="font-medium text-gray-800">
                      {processingStats.processedRows.toLocaleString()} / {processingStats.totalRows.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Elapsed:</span>
                    <div className="font-medium text-gray-800">
                      {formatTime(processingStats.elapsedTime)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Remaining:</span>
                    <div className="font-medium text-gray-800">
                      {processingStats.estimatedTimeRemaining > 0 
                        ? formatTime(processingStats.estimatedTimeRemaining)
                        : 'Calculating...'
                      }
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Completion:</span>
                    <div className="font-medium text-gray-800">
                      {processingStats.estimatedTimeRemaining > 0 
                        ? new Date(Date.now() + processingStats.estimatedTimeRemaining).toLocaleTimeString()
                        : '--'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warning Message */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-700">
                <p className="font-medium">This will permanently stop processing</p>
                <p className="mt-1">
                  You'll need to restart the analysis from the beginning if you want to continue.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Continue Processing
            </button>
            <button
              onClick={handleConfirm}
              disabled={isConfirming}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all ${
                isConfirming
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isConfirming ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Cancelling...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Square className="h-4 w-4" />
                  <span>Yes, Cancel Processing</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CancellationDialog;