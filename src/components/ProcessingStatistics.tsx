import React from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  BarChart3, 
  Clock, 
  Zap,
  TrendingUp,
  Database,
  Filter
} from 'lucide-react';

export interface ProcessingStatistics {
  // File statistics
  totalRows: number;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  skippedRows: number;
  
  // Processing metrics
  startTime: number;
  currentTime: number;
  estimatedEndTime: number | null;
  throughputRowsPerSecond: number;
  
  // Data quality
  warningCount: number;
  errorCount: number;
  cleaningOperations: {
    currencyFormatted: number;
    datesNormalized: number;
    statesConverted: number;
    duplicatesRemoved: number;
  };
  
  // Memory and performance
  memoryUsage: number;
  peakMemoryUsage: number;
  cpuUsage: number;
  
  // Stage information
  currentStage: string;
  completedStages: number;
  totalStages: number;
}

interface ProcessingStatisticsProps {
  statistics: ProcessingStatistics;
  showDetailed?: boolean;
  className?: string;
}

const ProcessingStatistics: React.FC<ProcessingStatisticsProps> = ({
  statistics,
  showDetailed = false,
  className = ''
}) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getProcessingRate = (): number => {
    const elapsedTime = statistics.currentTime - statistics.startTime;
    return statistics.processedRows / (elapsedTime / 1000);
  };

  const getDataQualityScore = (): number => {
    const totalIssues = statistics.warningCount + statistics.errorCount;
    const qualityScore = Math.max(0, 100 - (totalIssues / statistics.totalRows) * 100);
    return Math.round(qualityScore);
  };

  const getEfficiencyScore = (): number => {
    const expectedRate = 1000; // rows per second baseline
    const actualRate = statistics.throughputRowsPerSecond;
    const efficiency = Math.min(100, (actualRate / expectedRate) * 100);
    return Math.round(efficiency);
  };

  const elapsedTime = statistics.currentTime - statistics.startTime;
  const estimatedTimeRemaining = statistics.estimatedEndTime 
    ? statistics.estimatedEndTime - statistics.currentTime 
    : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Processing Statistics</h3>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Statistics Grid */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Total Rows */}
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-blue-500 mr-1" />
              <span className="text-sm font-medium text-blue-700">Total Rows</span>
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {formatNumber(statistics.totalRows)}
            </div>
            <div className="text-xs text-blue-600">
              {((statistics.processedRows / statistics.totalRows) * 100).toFixed(1)}% processed
            </div>
          </div>

          {/* Valid Rows */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-500 mr-1" />
              <span className="text-sm font-medium text-green-700">Valid Rows</span>
            </div>
            <div className="text-2xl font-bold text-green-800">
              {formatNumber(statistics.validRows)}
            </div>
            <div className="text-xs text-green-600">
              {statistics.processedRows > 0 
                ? ((statistics.validRows / statistics.processedRows) * 100).toFixed(1)
                : 0}% success rate
            </div>
          </div>

          {/* Warnings */}
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-1" />
              <span className="text-sm font-medium text-yellow-700">Warnings</span>
            </div>
            <div className="text-2xl font-bold text-yellow-800">
              {formatNumber(statistics.warningCount)}
            </div>
            <div className="text-xs text-yellow-600">
              {statistics.processedRows > 0 
                ? ((statistics.warningCount / statistics.processedRows) * 100).toFixed(2)
                : 0}% of rows
            </div>
          </div>

          {/* Errors */}
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-500 mr-1" />
              <span className="text-sm font-medium text-red-700">Errors</span>
            </div>
            <div className="text-2xl font-bold text-red-800">
              {formatNumber(statistics.errorCount)}
            </div>
            <div className="text-xs text-red-600">
              {statistics.processedRows > 0 
                ? ((statistics.errorCount / statistics.processedRows) * 100).toFixed(2)
                : 0}% of rows
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Zap className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-700">Throughput</span>
              </div>
              <span className="text-xs text-gray-500">rows/sec</span>
            </div>
            <div className="text-xl font-bold text-gray-800 mb-1">
              {Math.round(statistics.throughputRowsPerSecond)}
            </div>
            <div className="text-xs text-gray-600">
              Efficiency: {getEfficiencyScore()}%
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Time</span>
              </div>
              <span className="text-xs text-gray-500">elapsed</span>
            </div>
            <div className="text-xl font-bold text-gray-800 mb-1">
              {formatTime(elapsedTime)}
            </div>
            <div className="text-xs text-gray-600">
              ETA: {estimatedTimeRemaining > 0 ? formatTime(estimatedTimeRemaining) : '--'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-indigo-500" />
                <span className="text-sm font-medium text-gray-700">Quality</span>
              </div>
              <span className="text-xs text-gray-500">score</span>
            </div>
            <div className="text-xl font-bold text-gray-800 mb-1">
              {getDataQualityScore()}%
            </div>
            <div className="text-xs text-gray-600">
              Data integrity
            </div>
          </div>
        </div>

        {/* Detailed Statistics */}
        {showDetailed && (
          <div className="space-y-6">
            {/* Data Cleaning Operations */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Data Cleaning Operations
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-blue-800">
                    {statistics.cleaningOperations.currencyFormatted.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-600">Currency formatted</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-green-800">
                    {statistics.cleaningOperations.datesNormalized.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-600">Dates normalized</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-purple-800">
                    {statistics.cleaningOperations.statesConverted.toLocaleString()}
                  </div>
                  <div className="text-xs text-purple-600">States converted</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-sm font-medium text-orange-800">
                    {statistics.cleaningOperations.duplicatesRemoved.toLocaleString()}
                  </div>
                  <div className="text-xs text-orange-600">Duplicates removed</div>
                </div>
              </div>
            </div>

            {/* System Performance */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                System Performance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Memory Usage</span>
                    <span className="text-xs text-gray-500">
                      {((statistics.memoryUsage / statistics.peakMemoryUsage) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {formatBytes(statistics.memoryUsage)}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ 
                        width: `${(statistics.memoryUsage / statistics.peakMemoryUsage) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Peak: {formatBytes(statistics.peakMemoryUsage)}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">CPU Usage</span>
                    <span className="text-xs text-gray-500">estimated</span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {statistics.cpuUsage.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${statistics.cpuUsage}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Stage Progress</span>
                    <span className="text-xs text-gray-500">
                      {statistics.completedStages}/{statistics.totalStages}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-gray-800 mb-1">
                    {((statistics.completedStages / statistics.totalStages) * 100).toFixed(0)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ 
                        width: `${(statistics.completedStages / statistics.totalStages) * 100}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Current: {statistics.currentStage}
                  </div>
                </div>
              </div>
            </div>

            {/* Processing Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Processing Breakdown
              </h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valid Rows</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ 
                            width: `${(statistics.validRows / statistics.totalRows) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-16 text-right">
                        {statistics.validRows.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Invalid Rows</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ 
                            width: `${(statistics.invalidRows / statistics.totalRows) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-16 text-right">
                        {statistics.invalidRows.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Skipped Rows</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ 
                            width: `${(statistics.skippedRows / statistics.totalRows) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-16 text-right">
                        {statistics.skippedRows.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Remaining</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full"
                          style={{ 
                            width: `${((statistics.totalRows - statistics.processedRows) / statistics.totalRows) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-800 w-16 text-right">
                        {(statistics.totalRows - statistics.processedRows).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingStatistics;