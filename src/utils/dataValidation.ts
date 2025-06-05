import { CSVRow, ProcessedCSVRow, SalesDataRow } from '../types';
import { APP_CONFIG, VALIDATION_CONFIG } from '../config';

export const validateCSV = (data: CSVRow[]): void => {
  if (data.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Check required columns
  const firstRow = data[0];
  
  for (const column of VALIDATION_CONFIG.requiredColumns) {
    if (!(column in firstRow)) {
      throw new Error(`Required column '${column}' is missing from CSV`);
    }
  }

  // Validate each row
  data.forEach((row, index) => {
    validateRow(row, index + 1);
  });
};

const validateRow = (row: CSVRow, rowNumber: number): void => {
  // Validate date format (YYYY-MM-DD)
  if (!row.date) {
    throw new Error(`Row ${rowNumber}: Missing date value`);
  }

  // Validate state (2-letter code)
  if (!row.state || !VALIDATION_CONFIG.stateCodePattern.test(row.state.toString().trim())) {
    throw new Error(`Row ${rowNumber}: Invalid state code. Expected 2-letter state code, got '${row.state}'`);
  }

  // Validate sale_amount (numeric)
  const saleAmount = typeof row.sale_amount === 'number' ? row.sale_amount : parseFloat(row.sale_amount);
  if (isNaN(saleAmount)) {
    throw new Error(`Row ${rowNumber}: Invalid sale amount. Expected numeric value, got '${row.sale_amount}'`);
  }

  // Validate transaction_count if present (numeric)
  if (row.transaction_count !== undefined && row.transaction_count !== '') {
    const transCount = typeof row.transaction_count === 'number' ? 
      row.transaction_count : 
      parseInt(row.transaction_count.toString());
    
    if (isNaN(transCount)) {
      throw new Error(`Row ${rowNumber}: Invalid transaction count. Expected numeric value, got '${row.transaction_count}'`);
    }
  }
};

export const validateDateRange = (data: SalesDataRow[]): void => {
  // Get all unique dates
  const dates = data.map(row => new Date(row.date));
  
  // Find min and max dates
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Calculate year difference
  const yearDiff = maxDate.getFullYear() - minDate.getFullYear();
  
  if (yearDiff > VALIDATION_CONFIG.maxYearSpan) {
    throw new Error(`Data spans more than ${VALIDATION_CONFIG.maxYearSpan} years. Please provide data for 1-${VALIDATION_CONFIG.maxYearSpan} years only.`);
  }
};

export const validateFileSize = (file: File): void => {
  if (file.size > APP_CONFIG.maxFileSize) {
    throw new Error(`File size exceeds the maximum limit of ${APP_CONFIG.maxFileSize / (1024 * 1024)}MB.`);
  }
};