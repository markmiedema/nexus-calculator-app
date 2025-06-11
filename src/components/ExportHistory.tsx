import React, { useState, useEffect } from 'react';
import { ExportResult } from '../types/export';
import { 
  Clock, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileJson,
  Trash2,
  ExternalLink,
  Copy,
  CheckCircle,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react';

interface ExportHistoryItem extends ExportResult {
  id: string;
  timestamp: number;
  templateName?: string;
  dataRange?: {
    start: string;
    end: string;
  };
}

interface ExportHistoryProps {
  className?: string;
}

const ExportHistory: React.FC<ExportHistoryProps> = ({ className = '' }) => {
  const [history, setHistory] = useState<ExportHistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ExportHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadExportHistory();
  }, []);

  useEffect(() => {
    filterHistory();
  }, [history, searchTerm, filterFormat, filterStatus]);

  const loadExportHistory = () => {
    try {
      const savedHistory = localStorage.getItem('salt-nexus-export-history');
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.sort((a: ExportHistoryItem, b: ExportHistoryItem) => b.timestamp - a.timestamp));
      }
    } catch (error) {
      console.warn('Failed to load export history:', error);
    }
  };

  const saveExportHistory = (newHistory: ExportHistoryItem[]) => {
    try {
      localStorage.setItem('salt-nexus-export-history', JSON.stringify(newHistory));
      setHistory(newHistory);
    } catch (error) {
      console.warn('Failed to save export history:', error);
    }
  };

  const addExportToHistory = (exportResult: ExportResult, templateName?: string, dataRange?: { start: string; end: string }) => {
    const historyItem: ExportHistoryItem = {
      ...exportResult,
      id: `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      templateName,
      dataRange
    };

    const newHistory = [historyItem, ...history].slice(0, 50); // Keep last 50 exports
    saveExportHistory(newHistory);
  };

  const deleteExportFromHistory = (id: string) => {
    const newHistory = history.filter(item => item.id !== id);
    saveExportHistory(newHistory);
  };

  const clearAllHistory = () => {
    saveExportHistory([]);
  };

  const filterHistory = () => {
    let filtered = [...history];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.templateName && item.templateName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Format filter
    if (filterFormat !== 'all') {
      filtered = filtered.filter(item => item.format === filterFormat);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => 
        filterStatus === 'success' ? item.success : !item.success
      );
    }

    setFilteredHistory(filtered);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'excel':
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      case 'csv':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'json':
        return <FileJson className="h-4 w-4 text-purple-600" />;
      case 'pdf':
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const copyFilename = (filename: string) => {
    navigator.clipboard.writeText(filename);
    // You could add a toast notification here
  };

  // Expose the addExportToHistory function globally for use by other components
  useEffect(() => {
    (window as any).addExportToHistory = addExportToHistory;
    return () => {
      delete (window as any).addExportToHistory;
    };
  }, [addExportToHistory]);

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Export History</h3>
            <p className="text-sm text-gray-600 mt-1">
              Track and manage your previous exports
            </p>
          </div>
          
          {history.length > 0 && (
            <button
              onClick={clearAllHistory}
              className="flex items-center px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search exports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <select
            value={filterFormat}
            onChange={(e) => setFilterFormat(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Formats</option>
            <option value="excel">Excel</option>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
            <option value="pdf">PDF</option>
          </select>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {history.length === 0 
                ? 'No exports yet. Create your first export to see it here.'
                : 'No exports match your current filters.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex-shrink-0">
                    {getFormatIcon(item.format)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {item.filename}
                      </p>
                      
                      {item.success ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{formatTimestamp(item.timestamp)}</span>
                      
                      {item.success && (
                        <span>{formatFileSize(item.size)}</span>
                      )}
                      
                      {item.templateName && (
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {item.templateName}
                        </span>
                      )}
                      
                      {item.dataRange && (
                        <span>
                          {item.dataRange.start} - {item.dataRange.end}
                        </span>
                      )}
                    </div>
                    
                    {!item.success && item.error && (
                      <p className="text-xs text-red-600 mt-1">{item.error}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <button
                    onClick={() => copyFilename(item.filename)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                    title="Copy filename"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => deleteExportFromHistory(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Remove from history"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Statistics */}
      {history.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-gray-800">{history.length}</div>
              <div className="text-xs text-gray-500">Total Exports</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-green-600">
                {history.filter(item => item.success).length}
              </div>
              <div className="text-xs text-gray-500">Successful</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-red-600">
                {history.filter(item => !item.success).length}
              </div>
              <div className="text-xs text-gray-500">Failed</div>
            </div>
            
            <div>
              <div className="text-lg font-bold text-blue-600">
                {formatFileSize(history.filter(item => item.success).reduce((sum, item) => sum + item.size, 0))}
              </div>
              <div className="text-xs text-gray-500">Total Size</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportHistory;