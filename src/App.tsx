import React, { useState } from 'react';
import Header from './components/Header';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { ProcessedData } from './types';
import { processCSVData } from './utils/csvProcessor';
import Disclaimer from './components/Disclaimer';
import { YearSelectionProvider } from './context/YearSelectionContext';
import YearToggleBar from './components/YearToggleBar';

function App() {
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Process the CSV file
      const data = await processCSVData(file);
      setProcessedData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setProcessedData(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
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
            <FileUpload 
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
  );
}

export default App;