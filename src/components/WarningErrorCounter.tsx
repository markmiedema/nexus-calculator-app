import React, { useState } from 'react';
import { AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface WarningErrorCounterProps {
  warningCount: number;
  errorCount: number;
  warnings: string[];
  errors: string[];
  className?: string;
}

const WarningErrorCounter: React.FC<WarningErrorCounterProps> = ({
  warningCount,
  errorCount,
  warnings,
  errors,
  className = ''
}) => {
  const [showWarnings, setShowWarnings] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const hasIssues = warningCount > 0 || errorCount > 0;

  if (!hasIssues) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Processing Issues</h3>
          <div className="flex items-center space-x-3">
            {warningCount > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                <AlertTriangle className="h-3 w-3" />
                <span>{warningCount}</span>
              </div>
            )}
            
            {errorCount > 0 && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                <XCircle className="h-3 w-3" />
                <span>{errorCount}</span>
              </div>
            )}
          </div>
        </div>

        {/* Warnings Section */}
        {warningCount > 0 && (
          <div className="mb-4">
            <button
              onClick={() => setShowWarnings(!showWarnings)}
              className="w-full flex items-center justify-between p-3 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="font-medium text-yellow-800">Warnings ({warningCount})</span>
              </div>
              {showWarnings ? (
                <ChevronUp className="h-4 w-4 text-yellow-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-yellow-500" />
              )}
            </button>
            
            {showWarnings && (
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200 max-h-40 overflow-y-auto">
                <ul className="space-y-1 text-sm text-yellow-700">
                  {warnings.length > 0 ? (
                    warnings.map((warning, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-yellow-500 mt-0.5">•</span>
                        <span>{warning}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-yellow-600 italic">No detailed warnings available</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Errors Section */}
        {errorCount > 0 && (
          <div>
            <button
              onClick={() => setShowErrors(!showErrors)}
              className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="font-medium text-red-800">Errors ({errorCount})</span>
              </div>
              {showErrors ? (
                <ChevronUp className="h-4 w-4 text-red-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-red-500" />
              )}
            </button>
            
            {showErrors && (
              <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200 max-h-40 overflow-y-auto">
                <ul className="space-y-1 text-sm text-red-700">
                  {errors.length > 0 ? (
                    errors.map((error, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-red-500 mt-0.5">•</span>
                        <span>{error}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-red-600 italic">No detailed errors available</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Troubleshooting Tips */}
        {hasIssues && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <p className="font-medium mb-1">Troubleshooting Tips:</p>
            <ul className="space-y-1 text-xs">
              <li>• Check your data for formatting issues, especially dates and state codes</li>
              <li>• Ensure all required columns are present and properly labeled</li>
              <li>• Remove any special characters or formatting from numeric values</li>
              <li>• Consider downloading and using our template format</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarningErrorCounter;