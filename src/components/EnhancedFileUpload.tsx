import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, CheckCircle, X, Download, Info, Activity } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import MemoryMonitor from './MemoryMonitor';
import FileUploadWithMemoryCheck from './FileUploadWithMemoryCheck';
import { useMemoryMonitor } from '../hooks/useMemoryMonitor';
import { validateCSVWithSmartDetection, generateColumnMappingPreview, downloadCSVTemplate } from '../utils/dataValidation';

interface EnhancedFileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({ 
  onFileUpload, 
  isProcessing, 
  error 
}) => {
  const [showMemoryDetails, setShowMemoryDetails] = useState(false);
  const { memoryStats, formatBytes } = useMemoryMonitor();

  const handleFileSelect = (file: File) => {
    onFileUpload(file);
  };

  return (
    <div className="space-y-6">
      {/* Memory Status Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="h-5 w-5 text-gray-500" />
            <div>
              <h3 className="text-sm font-medium text-gray-700">System Status</h3>
              <p className="text-xs text-gray-500">
                Memory: {memoryStats.usedPercentage.toFixed(1)}% used • 
                Available: {formatBytes(memoryStats.availableMemory)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              memoryStats.isCritical ? 'bg-red-500' :
              memoryStats.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
            }`} />
            <span className="text-sm text-gray-600">
              {memoryStats.isCritical ? 'Critical' :
               memoryStats.isNearLimit ? 'Warning' : 'Good'}
            </span>
            
            <button
              onClick={() => setShowMemoryDetails(!showMemoryDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showMemoryDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
        </div>

        {/* Memory Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                memoryStats.isCritical ? 'bg-red-500' :
                memoryStats.isNearLimit ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(100, memoryStats.usedPercentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Detailed Memory Monitor */}
      {showMemoryDetails && (
        <MemoryMonitor 
          showDetailed={true}
          onMemoryWarning={(stats) => {
            console.warn('Memory warning:', stats);
          }}
          onMemoryCritical={(stats) => {
            console.error('Critical memory usage:', stats);
          }}
        />
      )}

      {/* File Upload with Memory Validation */}
      <FileUploadWithMemoryCheck
        onFileSelect={handleFileSelect}
        accept=".csv,.xlsx,.xls"
        maxFileSize={100 * 1024 * 1024} // 100MB
      />

      {/* Processing Status */}
      {isProcessing && (
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />
            <span className="text-sm font-medium text-gray-700">Processing file...</span>
          </div>
          <ProgressIndicator
            progress={0}
            message="Analyzing your sales data for SALT nexus compliance"
          />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-red-800 font-medium">Processing Error</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-blue-800 font-medium">Smart File Processing</h3>
            <div className="text-blue-700 text-sm mt-1 space-y-1">
              <p>• Automatic memory optimization for large files</p>
              <p>• Smart column detection for various CSV formats</p>
              <p>• Real-time memory monitoring and warnings</p>
              <p>• Chunked processing for files over 5,000 rows</p>
            </div>
            
            <div className="mt-3">
              <button
                onClick={downloadCSVTemplate}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedFileUpload;