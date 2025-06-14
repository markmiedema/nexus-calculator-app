import React from 'react';
import { ColumnMappingPreviewData } from '../utils/dataValidation';
import { CheckCircle, AlertCircle, XCircle, Download, Info } from 'lucide-react';

interface ColumnMappingPreviewProps {
  preview: ColumnMappingPreviewData;
  onDownloadTemplate: () => void;
  onProceed: () => void;
  onCancel: () => void;
}

const ColumnMappingPreview: React.FC<ColumnMappingPreviewProps> = ({
  preview,
  onDownloadTemplate,
  onProceed,
  onCancel
}) => {
  const { detectedMappings, unmappedHeaders, overallConfidence, canProceed } = preview;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'detected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'low_confidence':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'missing':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'detected':
        return 'text-green-800 bg-green-50 border-green-200';
      case 'low_confidence':
        return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      case 'missing':
        return 'text-red-800 bg-red-50 border-red-200';
      default:
        return 'text-gray-800 bg-gray-50 border-gray-200';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Group mappings by required vs optional
  const requiredMappings = detectedMappings.filter(m => m.isRequired);
  const optionalMappings = detectedMappings.filter(m => !m.isRequired);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Column Mapping Preview</h3>
          <p className="text-sm text-gray-600 mt-1">
            Review the detected column mappings before proceeding with analysis
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Overall Confidence</div>
          <div className={`text-xl font-bold ${getConfidenceColor(overallConfidence)}`}>
            {overallConfidence.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Required Columns Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Required Columns</h4>
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Standard Column
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detected Header
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requiredMappings.map((mapping) => (
                <tr key={mapping.standardColumn} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {mapping.standardColumn.replace('_', ' ')}
                      </span>
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Required
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-900">
                      {mapping.detectedHeader || 'Not detected'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${getConfidenceColor(mapping.confidence)}`}>
                      {mapping.confidence > 0 ? `${mapping.confidence.toFixed(1)}%` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getStatusIcon(mapping.status)}
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {mapping.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Optional Columns Section */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Optional Columns</h4>
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Standard Column
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detected Header
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Confidence
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {optionalMappings.map((mapping) => (
                <tr key={mapping.standardColumn} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">
                      {mapping.standardColumn.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-900">
                      {mapping.detectedHeader || 'Not detected'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${getConfidenceColor(mapping.confidence)}`}>
                      {mapping.confidence > 0 ? `${mapping.confidence.toFixed(1)}%` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      {getStatusIcon(mapping.status)}
                      <span className="ml-2 text-sm text-gray-700 capitalize">
                        {mapping.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unmapped Headers */}
      {unmappedHeaders.length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">Unmapped Columns</h4>
          <p className="text-sm text-blue-700 mb-2">
            The following columns were found but not mapped to standard fields:
          </p>
          <div className="flex flex-wrap gap-2">
            {unmappedHeaders.map((header) => (
              <span
                key={header}
                className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
              >
                {header}
              </span>
            ))}
          </div>
          <p className="text-xs text-blue-600 mt-2">
            These columns will be preserved but not used in the nexus analysis.
          </p>
        </div>
      )}

      {/* Status Messages */}
      {!canProceed && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <XCircle className="h-5 w-5 text-red-600 mr-2" />
            <h4 className="text-sm font-medium text-red-800">Cannot Proceed</h4>
          </div>
          <p className="text-sm text-red-700 mt-1">
            Required columns are missing. Please ensure your CSV contains columns for date, state, and sale amount.
          </p>
        </div>
      )}

      {canProceed && overallConfidence < 80 && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <h4 className="text-sm font-medium text-yellow-800">Low Confidence Detection</h4>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            Some column mappings have low confidence scores. Please review the mappings above to ensure they are correct.
          </p>
        </div>
      )}

      {canProceed && overallConfidence >= 80 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h4 className="text-sm font-medium text-green-800">Ready to Proceed</h4>
          </div>
          <p className="text-sm text-green-700 mt-1">
            All required columns detected with good confidence. You can proceed with the analysis.
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <button
          onClick={onDownloadTemplate}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Template
        </button>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            disabled={!canProceed}
            className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              canProceed
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-gray-400 bg-gray-200 cursor-not-allowed'
            }`}
          >
            Proceed with Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default ColumnMappingPreview;