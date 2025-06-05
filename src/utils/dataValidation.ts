import { SalesDataRow } from '../types';

export const validateCSV = (data: any[]): void => {
  if (data.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Check required columns
  const requiredColumns = ['date', 'state', 'sale_amount'];
  const firstRow = data[0];
  
  for (const column of requiredColumns) {
    if (!(column in firstRow)) {
      throw new Error(`Required column '${column}' is missing from CSV`);
    }
  }

  // Validate each row
  data.forEach((row, index) => {
    validateRow(row, index + 1);
  });
};

const validateRow = (row: any, rowNumber: number): void => {
  // Validate date format (YYYY-MM-DD)
  if (!row.date || !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
    throw new Error(`Row ${rowNumber}: Invalid date format. Expected YYYY-MM-DD, got '${row.date}'`);
  }

  // Validate state (2-letter code)
  if (!row.state || !/^[A-Za-z]{2}$/.test(row.state)) {
    throw new Error(`Row ${rowNumber}: Invalid state code. Expected 2-letter state code, got '${row.state}'`);
  }

  // Validate sale_amount (numeric)
  if (!row.sale_amount || isNaN(parseFloat(row.sale_amount))) {
    throw new Error(`Row ${rowNumber}: Invalid sale amount. Expected numeric value, got '${row.sale_amount}'`);
  }

  // Validate transaction_count if present (numeric)
  if (row.transaction_count !== undefined && row.transaction_count !== '' && isNaN(parseInt(row.transaction_count))) {
    throw new Error(`Row ${rowNumber}: Invalid transaction count. Expected numeric value, got '${row.transaction_count}'`);
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
  
  if (yearDiff > 4) {
    throw new Error('Data spans more than 4 years. Please provide data for 1-4 years only.');
  }
};

export const validateFileSize = (file: File): void => {
  // Check if file is over 50MB
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  
  if (file.size > maxSize) {
    throw new Error('File size exceeds the maximum limit of 50MB.');
  }
};