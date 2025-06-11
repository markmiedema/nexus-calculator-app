import React, { useState } from 'react';
import { ProcessedData } from '../types';
import { ExportResult } from '../types/export';
import ExportDialog from './ExportDialog';
import ExportHistory from './ExportHistory';
import ExportTemplateManager from './ExportTemplateManager';
import { 
  Download, 
  History, 
  Settings, 
  Share2,
  FileText,
  BarChart3,
  Users,
  Shield
} from 'lucide-react';

interface ExportSystemProps {
  data: ProcessedData;
  className?: string;
}

const ExportSystem: React.FC<ExportSystemProps> = ({ data, className = '' }) => {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'history' | 'templates'>('overview');

  const handleExportComplete = (result: ExportResult) => {
    // Add to history if the global function is available
    if ((window as any).addExportToHistory) {
      (window as any).addExportToHistory(result, undefined, data.dataRange);
    }
  };

  const getQuickExportOptions = () => [
    {
      id: 'executive-summary',
      name: 'Executive Summary',
      description: 'High-level overview for presentations',
      format: 'pdf',
      icon: <FileText className="h-5 w-5 text-red-600" />,
      useCase: 'Board meetings and executive reviews'
    },
    {
      id: 'full-analysis',
      name: 'Complete Analysis',
      description: 'Comprehensive Excel report',
      format: 'excel',
      icon: <BarChart3 className="h-5 w-5 text-green-600" />,
      useCase: 'Detailed compliance analysis'
    },
    {
      id: 'compliance-data',
      name: 'Compliance Data',
      description: 'JSON format for system integration',
      format: 'json',
      icon: <Settings className="h-5 w-5 text-purple-600" />,
      useCase: 'Automated compliance systems'
    }
  ];

  const getSharingRecommendations = () => [
    {
      audience: 'Internal Team',
      recommendation: 'Use Complete Analysis (Excel) with full data',
      icon: <Users className="h-5 w-5 text-blue-600" />,
      security: 'Full access to sensitive data'
    },
    {
      audience: 'External Auditors',
      recommendation: 'Use Audit Documentation with sanitized data',
      icon: <Shield className="h-5 w-5 text-green-600" />,
      security: 'Sanitized for external sharing'
    },
    {
      audience: 'Executive Leadership',
      recommendation: 'Use Executive Summary (PDF) format',
      icon: <FileText className="h-5 w-5 text-purple-600" />,
      security: 'High-level overview only'
    },
    {
      audience: 'Compliance Systems',
      recommendation: 'Use JSON format for automated processing',
      icon: <Settings className="h-5 w-5 text-orange-600" />,
      security: 'Machine-readable structured data'
    }
  ];

  const quickExportOptions = getQuickExportOptions();
  const sharingRecommendations = getSharingRecommendations();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveView('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Export Options
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Export History
          </button>
          <button
            onClick={() => setActiveView('templates')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeView === 'templates'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Template Manager
          </button>
        </nav>
      </div>

      {/* Content based on active view */}
      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* Quick Export Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Quick Export</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Export your analysis using pre-configured templates
                </p>
              </div>
              <button
                onClick={() => setShowExportDialog(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Custom Export
              </button>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {quickExportOptions.map((option) => (
                <div
                  key={option.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setShowExportDialog(true)}
                >
                  <div className="flex items-center mb-3">
                    {option.icon}
                    <h3 className="font-medium text-gray-800 ml-2">{option.name}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{option.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase">
                      {option.format}
                    </span>
                    <Download className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">{option.useCase}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sharing Recommendations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-6">
              <Share2 className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-bold text-gray-800">Sharing Recommendations</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {sharingRecommendations.map((rec, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    {rec.icon}
                    <h3 className="font-medium text-gray-800 ml-2">{rec.audience}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-2">{rec.recommendation}</p>
                  
                  <div className="flex items-center text-xs text-gray-500">
                    <Shield className="h-3 w-3 mr-1" />
                    {rec.security}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Export Guidelines */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-800 mb-4">Export Guidelines</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Best Practices</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Use sanitized exports when sharing externally</li>
                  <li>• Excel format provides the most comprehensive analysis</li>
                  <li>• PDF format is ideal for executive presentations</li>
                  <li>• JSON format works well for system integration</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Security Considerations</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Enable data sanitization for external sharing</li>
                  <li>• Review export contents before distribution</li>
                  <li>• Consider audience when selecting export format</li>
                  <li>• All exports include metadata about configuration</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'history' && (
        <ExportHistory />
      )}

      {activeView === 'templates' && (
        <ExportTemplateManager
          onTemplateSelect={(template) => {
            // Handle template selection
            setShowExportDialog(true);
          }}
        />
      )}

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          isOpen={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          data={data}
          onExportComplete={handleExportComplete}
        />
      )}
    </div>
  );
};

export default ExportSystem;