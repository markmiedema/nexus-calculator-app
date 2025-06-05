import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface DisclaimerProps {
  className?: string;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ className = '' }) => {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-amber-800 font-medium text-sm">Important Legal Disclaimer</h3>
          <div className="mt-2 text-sm text-amber-700 space-y-1">
            <p>This tool provides estimates only and is for informational purposes only. State tax laws change frequently and may have changed since this tool was last updated.</p>
            <p>Professional tax advice is required before making any compliance decisions. The user assumes all responsibility for compliance with applicable tax laws.</p>
            <p>No data is stored or retained by this application - all processing is done locally in your browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;