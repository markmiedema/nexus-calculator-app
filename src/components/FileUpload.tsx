import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, FileText, CheckCircle, X, Download, Info, Cpu } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import WorkerStatus from './WorkerStatus';
import ChunkProgressDisplay from './ChunkProgressDisplay';
import ColumnMappingPreview from './ColumnMappingPreview';
import { validateCSVWithSmartDetection, generateColumnMappingPreview, downloadCSVTemplate, ValidationResult } from '../utils/dataValidation';
import { detectColumns } from '../utils/columnDetection';
import { useWebWorker } from '../hooks/useWebWorker';
import { useChunkedProcessing } from '../hooks/useChunkedProcessing';
import { isWebWorkerSupported } from '../utils/workerFallback';
import { calculateOptimalChunkSize } from '../utils/chunkProcessor';
import * as XLSX from 'xlsx';
import { detectColumnMappings } from '../utils/nexusEngine/columnMappings';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processingStrategy, setProcessingStrategy] = useState<'chunked' | 'worker' | 'fallback'>('fallback');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);

  // Web Worker hook for background processing
  const {
    processData: processWithWorker,
    isProcessing: isWorkerProcessing,
    progress: workerProgress,
    error: workerError,
    isWorkerSupported: workerSupported,
    resetState: resetWorkerState
  } = useWebWorker({
    onProgress: (progress) => {
      console.log(`Worker progress: ${progress}%`);
    },
    onSuccess: (result) => {
      console.log('Worker processing completed successfully');
      resetWorkerState();
    },
    onError: (error) => {
      console.error('Worker processing failed:', error);
    }
  });

  // Chunked processing hook for large datasets
  const {
    processData: processWithChunks,
    isProcessing: isChunkedProcessing,
    progress: chunkProgress,
    stats: chunkStats,
    error: chunkError,
    resetState: resetChunkState
  } = useChunkedProcessing({
    onProgress: (progress) => {
      console.log(`Chunk progress: ${progress.overallProgress}%`);
    },
    onComplete: (results) => {
      console.log('Chunked processing completed successfully');
    },
    onError: (error) => {
      console.error('Chunked processing failed:', error);
    }
  });

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFileType(file)) {
        setSelectedFile(file);
        validateFile(file);
      } else {
        setValidationResult({
          isValid: false,
          errors: ['Invalid file type. Please upload a CSV or Excel file.'],
          warnings: [],
          suggestions: ['Supported formats: .csv, .xlsx, .xls']
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      validateFile(file);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const isValidFileType = (file: File): boolean => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    return validTypes.includes(file.type) || 
           file.name.endsWith('.csv') || 
           file.name.endsWith('.xlsx') || 
           file.name.endsWith('.xls');
  };

  const validateFile = async (file: File) => {
    try {
      setUploadProgress(10);
      
      // Read file
      const buffer = await readFileAsArrayBuffer(file);
      setUploadProgress(30);
      
      // Parse file
      let data: any[] = [];
      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(buffer);
        data = parseCSV(text);
      } else {
        const workbook = XLSX.read(buffer, { type: 'array' });
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
          data.push(...sheetData);
        });
      }
      
      setParsedData(data);
      setUploadProgress(60);
      
      // Determine optimal processing strategy
      const strategy = determineProcessingStrategy(data.length);
      setProcessingStrategy(strategy);
      
      // Try to detect columns using the nexus engine's column mappings
      const headers = Object.keys(data[0] || {});
      const mappings = detectColumnMappings(headers);
      console.log('Detected column mappings:', mappings);
      
      // Validate with smart detection
      const result = validateCSVWithSmartDetection(data);
      setValidationResult(result);
      
      if (result.isValid) {
        setShowPreview(true);
      }
      
      setUploadProgress(100);
    } catch (err) {
      console.error('Error validating file:', err);
      setValidationResult({
        isValid: false,
        errors: [err instanceof Error ? err.message : 'Failed to process file'],
        warnings: [],
        suggestions: ['Please check your file format and try again']
      });
    }
  };

  const determineProcessingStrategy = (dataSize: number): 'chunked' | 'worker' | 'fallback' => {
    if (dataSize > 5000) {
      return 'chunked';
    } else if (dataSize > 1000 && isWebWorkerSupported()) {
      return 'worker';
    } else {
      return 'fallback';
    }
  };

  const getProcessingStrategyInfo = (strategy: string, dataSize: number) => {
    switch (strategy) {
      case 'chunked':
        const config = calculateOptimalChunkSize(dataSize);
        return {
          name: 'Chunked Processing',
          description: `Large dataset will be processed in ${Math.ceil(dataSize / config.optimalSize)} chunks using ${config.workerPoolSize} workers`,
          icon: <Cpu className="h-4 w-4 text-purple-500" />,
          color: 'purple'
        };
      case 'worker':
        return {
          name: 'Background Processing',
          description: 'Medium dataset will be processed in the background using Web Workers',
          icon: <Cpu className="h-4 w-4 text-blue-500" />,
          color: 'blue'
        };
      case 'fallback':
        return {
          name: 'Main Thread Processing',
          description: 'Small dataset will be processed on the main thread',
          icon: <Cpu className="h-4 w-4 text-green-500" />,
          color: 'green'
        };
      default:
        return {
          name: 'Standard Processing',
          description: 'Data will be processed using the standard method',
          icon: <Cpu className="h-4 w-4 text-gray-500" />,
          color: 'gray'
        };
    }
  };

  const handleProceedWithAnalysis = () => {
    if (selectedFile) {
      setShowPreview(false);
      onFileUpload(selectedFile);
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setSelectedFile(null);
    setValidationResult(null);
    resetWorkerState();
    resetChunkState();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
  };

  const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as ArrayBuffer);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    return lines.slice(1).filter(line => line.trim()).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: Record<string, any> = {};
      
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      
      return row;
    });
  };

  // Show column mapping preview
  if (showPreview && validationResult?.detectionResult) {
    const preview = generateColumnMappingPreview(validationResult.detectionResult);
    return (
      <ColumnMappingPreview
        preview={preview}
        onDownloadTemplate={handleDownloadTemplate}
        onProceed={handleProceedWithAnalysis}
        onCancel={handleCancelPreview}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Processing Status Displays */}
      {(isWorkerProcessing || isChunkedProcessing) && (
        <div className="space-y-4">
          {/* Worker Status */}
          {isWorkerProcessing && (
            <WorkerStatus
              isProcessing={isWorkerProcessing}
              progress={workerProgress}
              error={workerError}
              isWorkerSupported={workerSupported}
            />
          )}

          {/* Chunked Processing Status */}
          {isChunkedProcessing && chunkProgress && (
            <ChunkProgressDisplay
              progress={chunkProgress}
              stats={chunkStats}
            />
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold text-gray-800">Upload Sales Data</h2>
            <div className="flex items-center space-x-3">
              {/* Processing Strategy Indicator */}
              {selectedFile && validationResult?.isValid && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 rounded-md">
                  {(() => {
                    const strategyInfo = getProcessingStrategyInfo(processingStrategy, parsedData.length);
                    return (
                      <>
                        {strategyInfo.icon}
                        <span className="text-xs text-gray-600">{strategyInfo.name}</span>
                      </>
                    );
                  })()}
                </div>
              )}
              
              {/* Worker Support Indicator */}
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <div className={`w-2 h-2 rounded-full ${workerSupported ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span>{workerSupported ? 'Workers Supported' : 'Fallback Mode'}</span>
              </div>
              
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <Download className="h-4 w-4 mr-1" />
                Download Template
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Upload a CSV or Excel file containing your sales data. Our smart detection will automatically 
            identify the correct columns for analysis.
            {workerSupported && (
              <span className="text-green-600 font-medium"> Large files will be processed efficiently using background workers.</span>
            )}
          </p>
        </div>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200 ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
          />
          
          {!selectedFile ? (
            <div className="flex flex-col items-center justify-center">
              <Upload className="h-12 w-12 text-blue-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Drag & Drop your file here
              </h3>
              <p className="text-gray-500 mb-4">or</p>
              <button
                onClick={handleUploadClick}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Browse Files
              </button>
              <p className="text-xs text-gray-500 mt-3">
                Supports CSV, Excel (.xlsx, .xls) files up to 50MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div className="flex items-center">
                  <FileText className="h-6 w-6 text-blue-500 mr-3" />
                  <div>
                    <p className="font-medium text-gray-800">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setValidationResult(null);
                    resetWorkerState();
                    resetChunkState();
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <ProgressIndicator
                  progress={uploadProgress}
                  message="Validating file structure..."
                />
              )}

              {/* Processing Strategy Info */}
              {validationResult?.isValid && (
                <div className="p-3 bg-blue-50 rounded-md">
                  {(() => {
                    const strategyInfo = getProcessingStrategyInfo(processingStrategy, parsedData.length);
                    return (
                      <div className="flex items-start space-x-2">
                        {strategyInfo.icon}
                        <div>
                          <p className="text-sm font-medium text-blue-800">{strategyInfo.name}</p>
                          <p className="text-xs text-blue-600 mt-1">{strategyInfo.description}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Validation Results */}
        {validationResult && (
          <div className="mt-6 space-y-4">
            {/* Errors */}
            {validationResult.errors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0 mr-3" />
                  <div>
                    <h3 className="text-red-800 font-medium">Validation Errors</h3>
                    <ul className="mt-2 text-sm text-red-700 space-y-1">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResult.warnings.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0 mr-3" />
                  <div>
                    <h3 className="text-yellow-800 font-medium">Warnings</h3>
                    <ul className="mt-2 text-sm text-yellow-700 space-y-1">
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Success */}
            {validationResult.isValid && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0 mr-3" />
                  <div>
                    <h3 className="text-green-800 font-medium">File Validated Successfully</h3>
                    <p className="mt-1 text-sm text-green-700">
                      All required columns detected. Click "Review Mappings" to proceed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {validationResult.suggestions.length > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0 mr-3" />
                  <div>
                    <h3 className="text-blue-800 font-medium">Suggestions</h3>
                    <ul className="mt-2 text-sm text-blue-700 space-y-1">
                      {validationResult.suggestions.map((suggestion, index) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Error */}
        {(error || workerError || chunkError) && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Error processing file</p>
              <p className="text-sm">{error || workerError || chunkError}</p>
            </div>
          </div>
        )}

        {/* Format Requirements */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Smart Column Detection & Processing</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Required Columns (auto-detected):</h4>
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Date:</strong> transaction_date, sale_date, order_date, etc.</li>
                <li><strong>State:</strong> state, state_code, ship_to_state, etc.</li>
                <li><strong>Amount:</strong> sale_amount, total, revenue, price, etc.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Optional Columns:</h4>
              <ul className="space-y-1 list-disc pl-5">
                <li><strong>Quantity:</strong> transaction_count, qty, units, etc.</li>
                <li><strong>Transaction ID:</strong> transaction_id, order_id, etc.</li>
                <li><strong>Revenue Type:</strong> revenue_type, sales_type, etc.</li>
                <li><strong>Product Category:</strong> product_category, category, etc.</li>
                <li><strong>Marketplace Flag:</strong> marketplace_facilitator_flag, etc.</li>
                <li><strong>Customer Type:</strong> customer_type, buyer_type, etc.</li>
                <li><strong>Exemption Certificate:</strong> exemption_certificate_id, etc.</li>
              </ul>
            </div>
          </div>
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              <strong>Smart Processing:</strong> Our system automatically chooses the best processing method based on your file size:
            </p>
            <ul className="mt-2 text-xs text-blue-600 space-y-1">
              <li>• <strong>Small files (&lt;1K rows):</strong> Fast main-thread processing</li>
              <li>• <strong>Medium files (1K-5K rows):</strong> Background Web Worker processing</li>
              <li>• <strong>Large files (&gt;5K rows):</strong> Chunked parallel processing with worker pool</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;