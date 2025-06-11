import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import EnhancedFileUpload from './components/EnhancedFileUpload';
import Dashboard from './components/Dashboard';
import { ProcessedData } from './types';
import { processCSVData } from './utils/csvProcessor';
import Disclaimer from './components/Disclaimer';
import { YearSelectionProvider } from './context/YearSelectionContext';
import { ProgressProvider } from './context/ProgressContext';
import YearToggleBar from './components/YearToggleBar';
import EnhancedProgressIndicator from './components/EnhancedProgressIndicator';
import WarningErrorCounter from './components/WarningErrorCounter';
import ProcessingSummary from './components/ProcessingSummary';
import { useProcessingStatistics } from './hooks/useProcessingStatistics';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [processingCompleted, setProcessingCompleted] = useState(false);

  const {
    statistics,
    initializeTracking,
    stopTracking,
    updateProcessedRows,
    addWarning,
    addError,
    updateCurrentStage,
    addCompletedStage
  } = useProcessingStatistics({
    onStatisticsUpdate: (stats) => {
      // Optional: Handle statistics updates
      console.log('Statistics updated:', stats);
    }
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      setWarnings([]);
      setErrors([]);
      setProcessingCompleted(false);
      
      // Initialize statistics tracking
      initializeTracking(1000); // Placeholder until we know actual row count
      updateCurrentStage('Reading File');
      
      // Process the CSV file with progress tracking
      const data = await processCSVData(file, (progress) => {
        // Update processed rows based on progress
        if (statistics) {
          updateProcessedRows(Math.floor((progress / 100) * statistics.totalRows));
        }
        
        // Update current stage based on progress
        if (progress < 20) {
          updateCurrentStage('Reading File');
        } else if (progress < 40) {
          updateCurrentStage('Detecting Columns');
          addCompletedStage();
        } else if (progress < 60) {
          updateCurrentStage('Cleaning Data');
          addCompletedStage();
        } else if (progress < 80) {
          updateCurrentStage('Analyzing Nexus');
          addCompletedStage();
        } else {
          updateCurrentStage('Generating Report');
          addCompletedStage();
        }
      });
      
      // Complete processing
      setProcessedData(data);
      setProcessingCompleted(true);
      stopTracking();
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setProcessedData(null);
      addError();
      
      // Add to errors list
      setErrors(prev => [...prev, errorMessage]);
      
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ProgressProvider enablePersistence={true}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {!processedData ? (
            <div className="max-w-3xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">SALT Nexus Calculator</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Upload your sales data to analyze State and Local Tax (SALT) nexus obligations and 
                  generate comprehensive compliance reports.
                </p>
              </div>
              
              {/* Processing Warnings/Errors Counter */}
              {(warnings.length > 0 || errors.length > 0) && (
                <div className="mb-6">
                  <WarningErrorCounter
                    warningCount={warnings.length}
                    errorCount={errors.length}
                    warnings={warnings}
                    errors={errors}
                  />
                </div>
              )}
              
              {/* Enhanced Progress Indicator */}
              {isProcessing && (
                <div className="mb-8">
                  <EnhancedProgressIndicator 
                    showControls={true}
                    showPersistence={true}
                  />
                </div>
              )}
              
              {/* Processing Summary (shown after completion) */}
              {processingCompleted && statistics && (
                <div className="mb-8">
                  <ProcessingSummary
                    statistics={statistics}
                    isCompleted={true}
                    hasErrors={errors.length > 0}
                  />
                </div>
              )}
              
              {/* Enhanced File Upload */}
              <EnhancedFileUpload 
                onFileUpload={handleFileUpload} 
                isProcessing={isProcessing}
                error={error}
              />
              
              <Disclaimer className="mt-8" />
            </div>
          ) : (
            <YearSelectionProvider availableYears={processedData.availableYears}>
              <YearToggleBar />
              <Dashboard data={processedData} />
            </YearSelectionProvider>
          )}
        </main>
        <footer className="bg-gray-800 text-white py-6 px-4">
          <div className="container mx-auto text-center text-sm">
            <p>© {new Date().getFullYear()} SALT Nexus Calculator. All rights reserved.</p>
            <p className="mt-2">This tool is for informational purposes only. Consult with a tax professional before making decisions.</p>
          </div>
        </footer>
      </div>
    </ProgressProvider>
  );
}

export default App;