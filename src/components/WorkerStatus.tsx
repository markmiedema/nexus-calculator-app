import React from 'react';
import { Cpu, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface WorkerStatusProps {
  isProcessing: boolean;
  progress: number;
  error: string | null;
  isWorkerSupported: boolean;
  className?: string;
}

const WorkerStatus: React.FC<WorkerStatusProps> = ({
  isProcessing,
  progress,
  error,
  isWorkerSupported,
  className = ''
}) => {
  if (!isProcessing && !error) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center space-x-3">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {error ? (
            <AlertCircle className="h-5 w-5 text-red-500" />
          ) : isProcessing ? (
            <Loader className="h-5 w-5 text-blue-500 animate-spin" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-500" />
          )}
        </div>

        {/* Status Content */}
        <div className="flex-grow">
          {error ? (
            <div>
              <p className="text-sm font-medium text-red-800">Processing Error</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          ) : isProcessing ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">
                  Processing data in background...
                </p>
                <span className="text-xs text-gray-500">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-green-800">Processing completed</p>
          )}
        </div>

        {/* Worker Type Indicator */}
        <div className="flex-shrink-0">
          <div className="flex items-center space-x-1">
            <Cpu className={`h-4 w-4 ${isWorkerSupported ? 'text-green-500' : 'text-yellow-500'}`} />
            <span className="text-xs text-gray-500">
              {isWorkerSupported ? 'Worker' : 'Fallback'}
            </span>
          </div>
        </div>
      </div>

      {/* Worker Support Notice */}
      {!isWorkerSupported && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
          <p>
            <strong>Note:</strong> Web Workers are not supported in this environment. 
            Processing will run on the main thread, which may cause temporary UI freezing for large files.
          </p>
        </div>
      )}
    </div>
  );
};

export default WorkerStatus;