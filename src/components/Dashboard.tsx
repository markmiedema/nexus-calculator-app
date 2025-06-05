import React, { useState } from 'react';
import { ProcessedData } from '../types';
import { useFilteredData } from '../hooks/useFilteredData';
import ExecutiveSummary from './report/ExecutiveSummary';
import StateAnalysis from './report/StateAnalysis';
import ComplianceTimeline from './report/ComplianceTimeline';
import Recommendations from './report/Recommendations';
import { Download, FileText, MapPin, Calendar, CheckSquare } from 'lucide-react';
import { generatePDF } from '../utils/pdf-generator';

interface DashboardProps {
  data: ProcessedData;
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Use filtered data based on selected years
  const filteredData = useFilteredData(data);

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    try {
      await generatePDF(filteredData);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">SALT Nexus Analysis Report</h1>
        <button
          onClick={handleDownloadPDF}
          disabled={isGeneratingPDF}
          className={`flex items-center px-4 py-2 rounded-md text-white ${
            isGeneratingPDF ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          } transition-colors`}
        >
          <Download className="h-4 w-4 mr-2" />
          {isGeneratingPDF ? 'Generating...' : 'Download PDF'}
        </button>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap flex items-center ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('summary')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Executive Summary
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap flex items-center ${
              activeTab === 'states'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('states')}
          >
            <MapPin className="h-4 w-4 mr-2" />
            State Analysis
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap flex items-center ${
              activeTab === 'timeline'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('timeline')}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Compliance Timeline
          </button>
          <button
            className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap flex items-center ${
              activeTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('recommendations')}
          >
            <CheckSquare className="h-4 w-4 mr-2" />
            Recommendations
          </button>
        </nav>
      </div>

      <div className="p-6">
        {activeTab === 'summary' && <ExecutiveSummary data={filteredData} />}
        {activeTab === 'states' && <StateAnalysis data={filteredData} />}
        {activeTab === 'timeline' && <ComplianceTimeline data={filteredData} />}
        {activeTab === 'recommendations' && <Recommendations data={filteredData} />}
      </div>
    </div>
  );
};

export default Dashboard;