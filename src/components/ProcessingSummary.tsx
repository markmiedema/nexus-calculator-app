import React from 'react';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  BarChart3, 
  FileText,
  TrendingUp,
  Award,
  Zap,
  Target
} from 'lucide-react';
import { ProcessingStatistics } from './ProcessingStatistics';

interface ProcessingSummaryProps {
  statistics: ProcessingStatistics;
  isCompleted: boolean;
  hasErrors: boolean;
  onViewDetails?: () => void;
  onDownloadReport?: () => void;
  className?: string;
}

const ProcessingSummary: React.FC<ProcessingSummaryProps> = ({
  statistics,
  isCompleted,
  hasErrors,
  onViewDetails,
  onDownloadReport,
  className = ''
}) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getOverallStatus = () => {
    if (hasErrors) {
      return {
        icon: <XCircle className="h-8 w-8 text-red-500" />,
        title: 'Processing Completed with Errors',
        subtitle: 'Some issues were encountered during processing',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-800'
      };
    }
    
    if (statistics.warningCount > 0) {
      return {
        icon: <AlertTriangle className="h-8 w-8 text-yellow-500" />,
        title: 'Processing Completed with Warnings',
        subtitle: 'Processing successful but some data quality issues were found',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-800'
      };
    }
    
    return {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      title: 'Processing Completed Successfully',
      subtitle: 'All data processed without issues',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800'
    };
  };

  const getDataQualityScore = (): number => {
    const totalIssues = statistics.warningCount + statistics.errorCount;
    const qualityScore = Math.max(0, 100 - (totalIssues / statistics.totalRows) * 100);
    return Math.round(qualityScore);
  };

  const getProcessingEfficiency = (): number => {
    const expectedRate = 1000; // baseline rows per second
    const actualRate = statistics.throughputRowsPerSecond;
    return Math.min(100, Math.round((actualRate / expectedRate) * 100));
  };

  const getSuccessRate = (): number => {
    return Math.round((statistics.validRows / statistics.processedRows) * 100);
  };

  const getTotalProcessingTime = (): number => {
    return statistics.currentTime - statistics.startTime;
  };

  const status = getOverallStatus();
  const qualityScore = getDataQualityScore();
  const efficiency = getProcessingEfficiency();
  const successRate = getSuccessRate();
  const processingTime = getTotalProcessingTime();

  return (
    <div className={`bg-white rounded-lg shadow-lg border overflow-hidden ${className}`}>
      {/* Header Status */}
      <div className={`px-6 py-4 ${status.bgColor} border-b ${status.borderColor}`}>
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            {status.icon}
          </div>
          <div className="flex-grow">
            <h2 className={`text-xl font-bold ${status.textColor}`}>
              {status.title}
            </h2>
            <p className={`text-sm ${status.textColor} opacity-80 mt-1`}>
              {status.subtitle}
            </p>
          </div>
          {isCompleted && (
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className={`text-sm font-medium ${status.textColor}`}>
                  {formatTime(processingTime)}
                </div>
                <div className={`text-xs ${status.textColor} opacity-70`}>
                  Total time
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Data Processed */}
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-center mb-2">
              <FileText className="h-5 w-5 text-blue-500 mr-1" />
            </div>
            <div className="text-2xl font-bold text-blue-800">
              {formatNumber(statistics.processedRows)}
            </div>
            <div className="text-sm text-blue-600 font-medium">Rows Processed</div>
            <div className="text-xs text-blue-500 mt-1">
              of {formatNumber(statistics.totalRows)} total
            </div>
          </div>

          {/* Success Rate */}
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-100">
            <div className="flex items-center justify-center mb-2">
              <Target className="h-5 w-5 text-green-500 mr-1" />
            </div>
            <div className="text-2xl font-bold text-green-800">
              {successRate}%
            </div>
            <div className="text-sm text-green-600 font-medium">Success Rate</div>
            <div className="text-xs text-green-500 mt-1">
              {formatNumber(statistics.validRows)} valid rows
            </div>
          </div>

          {/* Quality Score */}
          <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="flex items-center justify-center mb-2">
              <Award className="h-5 w-5 text-purple-500 mr-1" />
            </div>
            <div className="text-2xl font-bold text-purple-800">
              {qualityScore}%
            </div>
            <div className="text-sm text-purple-600 font-medium">Quality Score</div>
            <div className="text-xs text-purple-500 mt-1">
              Data integrity
            </div>
          </div>

          {/* Processing Speed */}
          <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-5 w-5 text-orange-500 mr-1" />
            </div>
            <div className="text-2xl font-bold text-orange-800">
              {Math.round(statistics.throughputRowsPerSecond)}
            </div>
            <div className="text-sm text-orange-600 font-medium">Rows/Second</div>
            <div className="text-xs text-orange-500 mt-1">
              {efficiency}% efficiency
            </div>
          </div>
        </div>

        {/* Issue Summary */}
        {(statistics.warningCount > 0 || statistics.errorCount > 0) && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Issue Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Warnings */}
              {statistics.warningCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="font-medium text-yellow-800">Warnings</span>
                    </div>
                    <span className="text-lg font-bold text-yellow-800">
                      {statistics.warningCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Data quality issues that were automatically resolved
                  </p>
                  <div className="mt-2 text-xs text-yellow-600">
                    {((statistics.warningCount / statistics.processedRows) * 100).toFixed(2)}% of processed rows
                  </div>
                </div>
              )}

              {/* Errors */}
              {statistics.errorCount > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="font-medium text-red-800">Errors</span>
                    </div>
                    <span className="text-lg font-bold text-red-800">
                      {statistics.errorCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-red-700">
                    Rows that could not be processed due to data issues
                  </p>
                  <div className="mt-2 text-xs text-red-600">
                    {((statistics.errorCount / statistics.processedRows) * 100).toFixed(2)}% of processed rows
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Performance Summary
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">
                  {formatTime(processingTime)}
                </div>
                <div className="text-sm text-gray-600">Total Processing Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">
                  {Math.round(statistics.throughputRowsPerSecond)} rows/sec
                </div>
                <div className="text-sm text-gray-600">Average Throughput</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-800">
                  {((statistics.memoryUsage / (1024 * 1024)).toFixed(1))} MB
                </div>
                <div className="text-sm text-gray-600">Peak Memory Usage</div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Cleaning Summary */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Cleaning Operations</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-blue-800">
                {statistics.cleaningOperations.currencyFormatted.toLocaleString()}
              </div>
              <div className="text-xs text-blue-600">Currency Formatted</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-green-800">
                {statistics.cleaningOperations.datesNormalized.toLocaleString()}
              </div>
              <div className="text-xs text-green-600">Dates Normalized</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-purple-800">
                {statistics.cleaningOperations.statesConverted.toLocaleString()}
              </div>
              <div className="text-xs text-purple-600">States Converted</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-orange-800">
                {statistics.cleaningOperations.duplicatesRemoved.toLocaleString()}
              </div>
              <div className="text-xs text-orange-600">Duplicates Removed</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">
              Completed at {new Date(statistics.currentTime).toLocaleTimeString()}
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            {onViewDetails && (
              <button
                onClick={onViewDetails}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                View Details
              </button>
            )}
            
            {onDownloadReport && (
              <button
                onClick={onDownloadReport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Download Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessingSummary;