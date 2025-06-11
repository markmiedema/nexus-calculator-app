import React, { useRef, useState } from 'react';
import { Upload, AlertCircle, FileText, CheckCircle, X, Download, Info, Eye } from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';
import ColumnMappingPreview from './ColumnMappingPreview';
import { validateCSVWithSmartDetection, generateColumnMappingPreview, downloadCSVTemplate, ValidationResult } from '../utils/dataValidation';
import { detectColumns } from '../utils/columnDetection';
import * as XLSX from 'xlsx';

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
      
      // Validate with smart detection
      const result = validateCSVWithSmartDetection(data);
      setValidationResult(result);
      
      setUploadProgress(100);
    } catch (err) {
      setValidationResult({
        isValid: false,
        errors: [err instanceof Error ? err.message : 'Failed to process file'],
        warnings: [],
        suggestions: ['Please check your file format and try again']
      });
    }
  };

  const handleShowPreview = () => {
    setShowPreview(true);
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-800">Upload Sales Data</h2>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <Download className="h-4 w-4 mr-1" />
            Download Template
          </button>
        </div>
        <p className="text-gray-600 text-sm">
          Upload a CSV or Excel file containing your sales data. Our smart detection will automatically 
          identify the correct columns for analysis.
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
          </div>
        )}
      </div>

      {/* Enhanced Column Matching Results */}
      {validationResult?.detectionResult && (
        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-blue-800">📊 Column Detection Results</h3>
              <div className="text-sm text-blue-600">
                Overall Confidence: <span className="font-bold">
                  {generateColumnMappingPreview(validationResult.detectionResult).overallConfidence.toFixed(1)}%
                </span>
              </div>
            </div>
            
            {/* Column Matching Grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Successfully Matched Columns */}
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <h4 className="font-medium text-green-800 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  ✅ Successfully Matched ({Object.values(validationResult.detectionResult.mapping).filter(v => v !== null).length})
                </h4>
                <div className="space-y-2">
                  {Object.entries(validationResult.detectionResult.mapping)
                    .filter(([_, header]) => header !== null)
                    .map(([standardName, detectedHeader]) => {
                      const confidence = validationResult.detectionResult!.confidence[standardName];
                      const isRequired = ['date', 'state', 'sale_amount'].includes(standardName);
                      return (
                        <div key={standardName} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-800">
                              {standardName.replace('_', ' ')}
                            </span>
                            {isRequired && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                Required
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              "{detectedHeader}"
                            </div>
                            <div className={`text-xs font-medium ${
                              confidence >= 90 ? 'text-green-600' : 
                              confidence >= 70 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {confidence.toFixed(1)}% match
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Missing/Unmatched Columns */}
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  📋 Column Status Summary
                </h4>
                <div className="space-y-3">
                  {/* Missing Required Columns */}
                  {Object.entries(validationResult.detectionResult.mapping)
                    .filter(([standardName, header]) => header === null && ['date', 'state', 'sale_amount'].includes(standardName))
                    .map(([standardName]) => (
                      <div key={standardName} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-100">
                        <div className="flex items-center">
                          <XCircle className="h-4 w-4 text-red-500 mr-2" />
                          <span className="font-medium text-red-800">
                            {standardName.replace('_', ' ')} (Required)
                          </span>
                        </div>
                        <span className="text-xs text-red-600 font-medium">Not Found</span>
                      </div>
                    ))}

                  {/* Missing Optional Columns */}
                  {Object.entries(validationResult.detectionResult.mapping)
                    .filter(([standardName, header]) => header === null && !['date', 'state', 'sale_amount'].includes(standardName))
                    .map(([standardName]) => (
                      <div key={standardName} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                        <div className="flex items-center">
                          <AlertCircle className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-gray-600">
                            {standardName.replace('_', ' ')} (Optional)
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Not Found</span>
                      </div>
                    ))}

                  {/* Unmapped Headers */}
                  {validationResult.detectionResult.unmappedHeaders.length > 0 && (
                    <div className="p-2 bg-blue-50 rounded border border-blue-100">
                      <div className="text-sm font-medium text-blue-800 mb-1">
                        Unmapped Columns ({validationResult.detectionResult.unmappedHeaders.length}):
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {validationResult.detectionResult.unmappedHeaders.map(header => (
                          <span key={header} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            "{header}"
                          </span>
                        ))}
                      </div>
                      <div className="text-xs text-blue-600 mt-1">
                        These will be preserved but not used in analysis
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-blue-200">
              <div className="text-sm text-blue-700">
                {validationResult.isValid ? (
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                    Ready for analysis
                  </span>
                ) : (
                  <span className="flex items-center">
                    <XCircle className="h-4 w-4 mr-1 text-red-500" />
                    Missing required columns
                  </span>
                )}
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleShowPreview}
                  className="flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Review Mappings
                </button>
                
                {validationResult.isValid && (
                  <button
                    onClick={handleProceedWithAnalysis}
                    className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Proceed with Analysis
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Error processing file</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Enhanced Format Requirements */}
      <div className="mt-6 border-t border-gray-200 pt-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Smart Column Detection</h3>
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
            <h4 className="font-medium text-gray-700 mb-2">Optional Columns (enhanced):</h4>
            <ul className="space-y-1 list-disc pl-5">
              <li><strong>Quantity:</strong> transaction_count, qty, units, etc.</li>
              <li><strong>City:</strong> city, customer_city, billing_city, etc.</li>
              <li><strong>County:</strong> county, customer_county, parish, borough, etc.</li>
              <li><strong>Zip Code:</strong> zip_code, zip, postal_code, etc.</li>
            </ul>
          </div>
        </div>
        
        {/* Enhanced Template Information */}
        <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-2">📋 Enhanced Template Features</h4>
          <div className="grid md:grid-cols-2 gap-3 text-sm text-blue-700">
            <div>
              <p className="font-medium mb-1">✨ What's New:</p>
              <ul className="space-y-1 text-xs">
                <li>• Comprehensive geographic data (city, county, zip)</li>
                <li>• 20 sample transactions across major US markets</li>
                <li>• Realistic county variations (parishes, boroughs)</li>
                <li>• Enhanced nexus analysis capabilities</li>
              </ul>
            </div>
            <div>
              <p className="font-medium mb-1">🎯 Perfect For:</p>
              <ul className="space-y-1 text-xs">
                <li>• Multi-state e-commerce businesses</li>
                <li>• Detailed geographic nexus analysis</li>
                <li>• Local tax jurisdiction tracking</li>
                <li>• Comprehensive compliance reporting</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-3 p-3 bg-green-50 rounded-md border border-green-200">
          <p className="text-sm text-green-700">
            <strong>🚀 Smart Detection:</strong> Our enhanced system automatically identifies columns using fuzzy matching, 
            supporting various naming conventions and formats. Now includes geographic data for more precise nexus analysis!
          </p>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;