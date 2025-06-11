// Fallback processing for environments without Web Worker support
import { ProcessedData } from '../types';
import { processCSVData as originalProcessCSVData } from './csvProcessor';

export const processCSVDataFallback = async (
  data: any[],
  onProgress?: (progress: number) => void
): Promise<ProcessedData> => {
  // Use the original CSV processor as fallback
  // This will run on the main thread but with progress callbacks
  
  if (onProgress) {
    onProgress(0);
  }

  try {
    // Simulate the worker's progress reporting
    const progressInterval = setInterval(() => {
      // This is a simple simulation - in reality the original processor
      // would need to be modified to support progress callbacks
      if (onProgress) {
        const currentProgress = Math.min(90, Math.random() * 100);
        onProgress(currentProgress);
      }
    }, 100);

    // Create a mock file for the original processor
    const csvContent = convertDataToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'data.csv', { type: 'text/csv' });

    const result = await originalProcessCSVData(file, onProgress);

    clearInterval(progressInterval);
    
    if (onProgress) {
      onProgress(100);
    }

    return result;
  } catch (error) {
    throw new Error(`Fallback processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const convertDataToCSV = (data: any[]): string => {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes in CSV values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ];

  return csvRows.join('\n');
};

export const isWebWorkerSupported = (): boolean => {
  return typeof Worker !== 'undefined' && typeof window !== 'undefined';
};