import React from 'react';
import { useYearSelection } from '../context/YearSelectionContext';
import { Check, Calendar } from 'lucide-react';

const YearToggleBar: React.FC = () => {
  const { selectedYears, availableYears, toggleYear, selectAllYears, clearAllYears } = useYearSelection();

  const getYearRangeText = () => {
    if (selectedYears.length === 0) return 'No years selected';
    if (selectedYears.length === 1) return `${selectedYears[0]} only`;
    if (selectedYears.length === availableYears.length) return 'All years';

    const sorted = [...selectedYears].sort();
    const isConsecutive = sorted.every((year, i) =>
      i === 0 || parseInt(year) === parseInt(sorted[i-1]) + 1
    );

    if (isConsecutive) {
      return `${sorted[0]} - ${sorted[sorted.length - 1]}`;
    }
    return `${selectedYears.length} years selected`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-700">Analysis Period</h3>
          <span className="text-sm text-gray-500">({getYearRangeText()})</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={selectAllYears}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Select All
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={clearAllYears}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {selectedYears.length === 0 && (
        <div className="mb-3 p-2 bg-amber-50 text-amber-700 text-sm rounded">
          Select at least one year to view analysis
        </div>
      )}

      <div className="flex items-center space-x-4">
        {availableYears.map(year => (
          <button
            key={year}
            onClick={() => toggleYear(year)}
            className={`flex items-center px-3 py-1.5 rounded-md border transition-all ${
              selectedYears.includes(year)
                ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Check className={`h-4 w-4 mr-1.5 transition-opacity ${
              selectedYears.includes(year) ? 'opacity-100' : 'opacity-0'
            }`} />
            {year}
          </button>
        ))}
      </div>
    </div>
  );
};

export default YearToggleBar;