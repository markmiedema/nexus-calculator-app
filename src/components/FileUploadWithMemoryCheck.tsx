import React, { useState, useCallback } from 'react';
import { Upload, AlertTriangle, CheckCircle, Activity, Trash2 } from 'lucide-react';
import { useFileMemoryValidation, useMemoryMonitor } from '../hooks/useMemoryMonitor';
import MemoryMonitor from './MemoryMonitor';

interface FileUploadWithMemoryCheckProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxFileSize?: number;
  className?: string;
}

const FileUploadWithMemoryCheck: React.FC<FileUploadWithMemoryCheckProps> = ({
  onFileSelect,
  accept = '.csv,.xlsx,.xls',
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  className = ''
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showMemoryMonitor, setShowMemoryMonitor] = useState(false);

  const { validateFile, formatBytes } = useFileMemoryValidation();
  const { triggerGC, memoryStats } = useMemoryMonitor({
    onWarning: (stats) => {
      console.warn('Memory warning:', stats);
    },
    onCritical: (stats) => {
      console.error('Critical memory usage:', stats);
    }
  });

  const handleFileValidation = useCallback((file: File) => {
    const result = validateFile(file);
    setValidationResult(result);
    setSelectedFile(file);

    if (result.canProcess) {
      onFileSelect(file);
    }
  }, [validateFile, onFileSelect]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileValidation(e.dataTransfer.files[0]);
    }
  }, [handleFileValidation]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileValidation(e.target.files[0]);
    }
  }, [handleFileValidation]);

  const handleClearFile = useCallback(() => {
    setSelectedFile(null);
    setValidationResult(null);
  }, []);

  const handleOptimizeMemory = useCallback(() => {
    triggerGC();
  }, [triggerGC]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Memory Monitor Toggle */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-800">File Upload</h3>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Activity className="h-4 w-4" />
            <span>Memory: {memoryStats.usedPercentage.toFixed(1)}%</span>
          </div>
          <button
            onClick={() => setShowMemoryMonitor(!showMemoryMonitor)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            {showMemoryMonitor ? 'Hide' : 'Show'} Monitor
          </button>
        </div>
      </div>

      {/* Memory Monitor */}
      {showMemoryMonitor && (
        <MemoryMonitor 
          showDetailed={true}
          onMemoryWarning={(stats) => {
            console.warn('Memory warning in file upload:', stats);
          }}
          onMemoryCritical={(stats) => {
            console.error('Critical memory in file upload:', stats);
          }}
        />
      )}

      {/* Memory Status Bar */}
      <div className="bg-white rounded-lg border p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Memory Status</span>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {formatBytes(memoryStats.availableMemory)} available
            </span>
            <button
              onClick={handleOptimizeMemory}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
              title="Optimize memory"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
        
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

      {/* File Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive
            ? 'border-blue-500 bg-blue-50'
            : validationResult?.canProcess === false
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        {!selectedFile ? (
          <div className="space-y-4">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-700">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports CSV, Excel files up to {formatBytes(maxFileSize)}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-center space-x-3">
              <div className="text-left">
                <p className="font-medium text-gray-800">{selectedFile.name}</p>
                <p className="text-sm text-gray-500">
                  {formatBytes(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={handleClearFile}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Validation Result */}
            {validationResult && (
              <div className={`p-3 rounded-lg border ${
                validationResult.canProcess
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <div className="flex items-start space-x-2">
                  {validationResult.canProcess ? (
                    <CheckCircle className="h-5 w-5 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mt-0.5" />
                  )}
                  <div>
                    <p className="font-medium">
                      {validationResult.canProcess ? 'File Ready for Processing' : 'Cannot Process File'}
                    </p>
                    {validationResult.reason && (
                      <p className="text-sm mt-1">{validationResult.reason}</p>
                    )}
                    
                    {/* Memory Details */}
                    <div className="mt-2 text-sm space-y-1">
                      <div>File Size: {validationResult.fileSizeFormatted}</div>
                      <div>Available Memory: {validationResult.availableMemoryFormatted}</div>
                      <div>Current Usage: {validationResult.memoryUsagePercentage.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Memory Recommendations */}
      {(memoryStats.isNearLimit || memoryStats.isCritical) && (
        <div className={`p-3 rounded-lg border ${
          memoryStats.isCritical
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 mt-0.5" />
            <div>
              <p className="font-medium">
                {memoryStats.isCritical ? 'Critical Memory Usage' : 'High Memory Usage'}
              </p>
              <ul className="text-sm mt-1 space-y-1">
                <li>• Consider processing smaller files</li>
                <li>• Close other browser tabs</li>
                <li>• Refresh the page to clear memory</li>
                {memoryStats.isCritical && (
                  <li>• Wait for memory to be freed before uploading</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Processing Capacity Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Current Processing Capacity</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-blue-600">Max Rows:</span>
            <div className="font-medium">
              {memoryStats.availableMemory > 0 
                ? Math.floor(memoryStats.availableMemory / (1024 * 3)).toLocaleString()
                : 'Unknown'
              }
            </div>
          </div>
          <div>
            <span className="text-blue-600">Max File Size:</span>
            <div className="font-medium">
              {formatBytes(Math.floor(memoryStats.availableMemory / 3))}
            </div>
          </div>
          <div>
            <span className="text-blue-600">Recommended:</span>
            <div className="font-medium">
              {memoryStats.isCritical ? 'Wait' : 
               memoryStats.isNearLimit ? 'Small files' : 'Any size'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadWithMemoryCheck;