import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, FileText, CheckCircle, X, Download, Info, Cpu, AlertTriangle } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import WorkerStatus from './WorkerStatus';
import ChunkProgressDisplay from './ChunkProgressDisplay';
import ColumnMappingPreview from './ColumnMappingPreview';
import CancellationDialog from './CancellationDialog';
import ProcessingStatistics from './ProcessingStatistics';
import ProcessingSummary from './ProcessingSummary';
import { validateCSVWithSmartDetection, generateColumnMappingPreview, downloadCSVTemplate, ValidationResult } from '../utils/dataValidation';
import { detectColumns } from '../utils/columnDetection';
import { useWebWorker } from '../hooks/useWebWorker';
import { useChunkedProcessing } from '../hooks/useChunkedProcessing';
import { useProcessingStatistics } from '../hooks/useProcessingStatistics';
import { isWebWorkerSupported } from '../utils/workerFallback';
import { calculateOptimalChunkSize } from '../utils/chunkProcessor';
import * as XLSX from 'xlsx';

interface EnhancedFileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const EnhancedFileUpload: React.FC<EnhancedFileUploadProps> = ({ onFileUpload, isProcessing, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [processingStrategy, setProcessingStrategy] = useState<'chunked' | 'worker' | 'fallback'>('fallback');
  const [showCancellationDialog, setShowCancellationDialog] = useState(false);
  const [showDetailedStats, setShowDetailedStats] = useState(false);
  const [processingCompleted, setProcessingCompleted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Processing statistics hook
  const {
    statistics,
    isTracking,
    initializeTracking,
    stopTracking,
    resetTracking,
    addProcessedRows,
    addValidRows,
    addInvalidRows,
    addWarning,
    addError,
    updateCurrentStage,
    addCompletedStage,
    addCleaningOperation
  } = useProcessingStatistics({
    updateInterval: 500,
    onStatisticsUpdate: (stats) => {
      // Optional: Handle statistics updates
      console.log('Statistics updated:', stats);
    }
  });

  // Web Worker hook
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
      setProcessingCompleted(true);
      stopTracking();
      resetWorkerState();
    },
    onError: (error) => {
      console.error('Worker processing failed:', error);
      addError();
      stopTracking();
    }
  });

  // Chunked processing hook
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
      setProcessingCompleted(true);
      stopTracking();
    },
    onError: (error) => {
      console.error('Chunked processing failed:', error);
      addError();
      stopTracking();
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
      
      setUploadProgress(60);
      
      // Determine optimal processing strategy
      const strategy = determineProcessingStrategy(data.length);
      setProcessingStrategy(strategy);
      
      // Initialize statistics tracking
      initializeTracking(data.length);
      updateCurrentStage('File Validation');
      
      // Validate with smart detection
      const result = validateCSVWithSmartDetection(data);
      setValidationResult(result);
      
      if (result.isValid) {
        setShowPreview(true);
        addCompletedStage();
      } else {
        addError();
      }
      
      setUploadProgress(100);
    } catch (err) {
      addError();
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
      updateCurrentStage('Starting Analysis');
      onFileUpload(selectedFile);
    }
  };

  const handleCancelProcessing = () => {
    setShowCancellationDialog(true);
  };

  const handleConfirmCancellation = () => {
    // Cancel all processing
    resetWorkerState();
    resetChunkState();
    stopTracking();
    setShowCancellationDialog(false);
    setProcessingCompleted(false);
    
    // Reset file state
    setSelectedFile(null);
    setValidationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = () => {
    setShowPreview(false);
    setSelectedFile(null);
    setValidationResult(null);
    resetTracking();
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

  return (
    <div className="space-y-6">
      {/* Rest of the component JSX */}
    </div>
  );
};

export default EnhancedFileUpload;