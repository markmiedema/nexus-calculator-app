import React from 'react';

interface ProgressIndicatorProps {
  progress: number;
  message?: string;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, message }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          {message || 'Processing...'}
        </span>
        <span className="text-sm text-gray-500">{progress}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressIndicator;