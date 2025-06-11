import React, { useState } from 'react';
import Header from './components/Header';
import EnhancedFileUpload from './components/EnhancedFileUpload';
import Dashboard from './components/Dashboard';
import { ProcessedData } from './types';
import { processCSVData } from './utils/csvProcessor';
import Disclaimer from './components/Disclaimer';
import { YearSelectionProvider } from './context/YearSelectionContext';
import { ProgressProvider } from './context/ProgressContext';
import YearToggleBar from './components/YearToggleBar';
import EnhancedProgressIndicator from './components/EnhancedProgressIndicator';
import { useMemoryMonitor } from './hooks/useMemoryMonitor';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memory monitoring
  const { memoryStats, triggerGC } = useMemoryMonitor({
    onWarning: (stats) => {
      console.warn('Memory warning in App:', stats);
    },
    onCritical: (stats) => {
      console.error('Critical memory usage in App:', stats);
      // Auto-trigger GC on critical memory
      triggerGC();
    }
  });

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Check memory before processing
      if (memoryStats.isCritical) {
        throw new Error('Memory usage is critically high. Please refresh the page and try again.');
      }
      
      // Process the CSV file
      const data = await processCSVData(file);
      setProcessedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setProcessedData(null);
    } finally {
      setIsProcessing(false);
      // Trigger GC after processing to clean up
      setTimeout(() => triggerGC(), 1000);
    }
  };

  return (
    <ProgressProvider enablePersistence={true}>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-8">
          {!processedData ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">SALT Nexus Calculator</h1>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Upload your sales data to analyze State and Local Tax (SALT) nexus obligations and 
                  generate comprehensive compliance reports with intelligent memory management.
                </p>
              </div>
              
              {/* Enhanced Progress Indicator */}
              {isProcessing && (
                <div className="mb-8">
                  <EnhancedProgressIndicator 
                    showControls={true}
                    showPersistence={true}
                  />
                </div>
              )}
              
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