import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, FileText, CheckCircle, X } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  error: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, isProcessing, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        setSelectedFile(file);
        handleProcessFile(file);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      handleProcessFile(file);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProcessFile = async (file: File) => {
    try {
      setUploadProgress(0);
      await onFileUpload(file);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Upload Sales Data</h2>
        <p className="text-gray-600 text-sm">
          Upload a CSV file containing your sales data to analyze nexus obligations.
          The file should include columns for date, state, and sale_amount.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
        } transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv"
          onChange={handleFileSelect}
        />
        
        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center">
            <Upload className="h-12 w-12 text-blue-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Drag & Drop your CSV file here
            </h3>
            <p className="text-gray-500 mb-4">or</p>
            <button
              onClick={handleUploadClick}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              Browse Files
            </button>
          </div>
        ) : (
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
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSelectedFile(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleProcessFile(selectedFile)}
                disabled={isProcessing}
                className={`px-4 py-2 rounded-md text-white flex items-center ${
                  isProcessing 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                } transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Analyze Data
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="mt-6">
          <ProgressIndicator
            progress={uploadProgress}
            message="Processing your sales data..."
          />
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error processing file</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">CSV Format Requirements:</h3>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li>Required columns: date (YYYY-MM-DD), state (2-letter code), sale_amount (numeric)</li>
          <li>Optional columns: transaction_count, customer_address</li>
          <li>File can contain data for 1-4 years</li>
          <li>CSV must include a header row with column names</li>
          <li>Maximum file size: 50MB</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;