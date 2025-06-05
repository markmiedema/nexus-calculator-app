import { describe, it, expect } from 'vitest';
import { validateCSV, validateDateRange, validateFileSize } from '../dataValidation';
import { CSVRow, SalesDataRow } from '../../types';

describe('dataValidation', () => {
  describe('validateCSV', () => {
    it('should throw error for empty data', () => {
      expect(() => validateCSV([])).toThrow('CSV file is empty');
    });

    it('should throw error for missing required columns', () => {
      const data = [{ state: 'CA', sale_amount: '1000' }] as CSVRow[];
      expect(() => validateCSV(data)).toThrow("Required column 'date' is missing");
    });

    it('should validate valid data without throwing', () => {
      const data = [{
        date: '2024-01-01',
        state: 'CA',
        sale_amount: '1000',
      }] as CSVRow[];
      expect(() => validateCSV(data)).not.toThrow();
    });
  });

  describe('validateDateRange', () => {
    it('should throw error for data spanning more than 4 years', () => {
      const data = [
        { date: '2020-01-01', state: 'CA', sale_amount: 1000 },
        { date: '2025-01-01', state: 'CA', sale_amount: 1000 },
      ] as SalesDataRow[];
      expect(() => validateDateRange(data)).toThrow('Data spans more than 4 years');
    });

    it('should accept data within 4 years', () => {
      const data = [
        { date: '2024-01-01', state: 'CA', sale_amount: 1000 },
        { date: '2025-01-01', state: 'CA', sale_amount: 1000 },
      ] as SalesDataRow[];
      expect(() => validateDateRange(data)).not.toThrow();
    });
  });

  describe('validateFileSize', () => {
    it('should throw error for files over 50MB', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      Object.defineProperty(file, 'size', { value: 55 * 1024 * 1024 });
      expect(() => validateFileSize(file)).toThrow('File size exceeds the maximum limit');
    });

    it('should accept files under 50MB', () => {
      const file = new File([''], 'test.csv', { type: 'text/csv' });
      Object.defineProperty(file, 'size', { value: 45 * 1024 * 1024 });
      expect(() => validateFileSize(file)).not.toThrow();
    });
  });
});