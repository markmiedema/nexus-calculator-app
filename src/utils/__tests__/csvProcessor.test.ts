import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processCSVData } from '../csvProcessor';
import * as XLSX from 'xlsx';

// Mock XLSX for testing
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn()
  }
}));

describe('csvProcessor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processCSVData', () => {
    it('should process user actual CSV format successfully', async () => {
      // Mock the user's actual data format
      const mockUserData = [
        {
          'Transaction Date': '2022-01-05',
          'State': 'California',
          'County': 'San Diego County',
          'City': 'San Diego',
          'Sales Amount ($)': '1814.99'
        },
        {
          'Transaction Date': '2022-01-23',
          'State': 'California', 
          'County': 'San Diego County',
          'City': 'San Diego',
          'Sales Amount ($)': '1726.79'
        },
        {
          'Transaction Date': '2022-01-04',
          'State': 'California',
          'County': 'San Diego County', 
          'City': 'San Diego',
          'Sales Amount ($)': '720.39'
        }
      ];

      // Mock XLSX functions
      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {}
        }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockUserData);

      // Create a mock file
      const mockFile = new File(['mock csv content'], 'test.csv', { type: 'text/csv' });

      const result = await processCSVData(mockFile);

      expect(result).toBeDefined();
      expect(result.nexusStates).toBeDefined();
      expect(result.salesByState).toBeDefined();
      expect(result.availableYears).toContain('2022');
      expect(result.salesByState.some(state => state.code === 'CA')).toBe(true);
    });

    it('should handle missing columns gracefully', async () => {
      const mockDataMissingColumns = [
        {
          'Date': '2024-01-01',
          'State': 'CA'
          // Missing sale_amount
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockDataMissingColumns);

      const mockFile = new File([''], 'test.csv', { type: 'text/csv' });

      await expect(processCSVData(mockFile)).rejects.toThrow();
    });

    it('should handle bad data gracefully', async () => {
      const mockBadData = [
        {
          'date': 'invalid-date',
          'state': 'INVALID_STATE',
          'sale_amount': 'not-a-number'
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockBadData);

      const mockFile = new File([''], 'test.csv', { type: 'text/csv' });

      // Should not throw but should handle bad data
      const result = await processCSVData(mockFile);
      expect(result.salesByState.length).toBe(0); // No valid data processed
    });

    it('should handle empty file', async () => {
      (XLSX.read as any).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      });
      (XLSX.utils.sheet_to_json as any).mockReturnValue([]);

      const mockFile = new File([''], 'empty.csv', { type: 'text/csv' });

      await expect(processCSVData(mockFile)).rejects.toThrow('CSV file is empty');
    });

    it('should process large files efficiently', async () => {
      // Generate large dataset (10k+ rows)
      const largeDataset = Array.from({ length: 12000 }, (_, i) => ({
        'date': `2024-${String(Math.floor(i / 365) + 1).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
        'state': ['CA', 'TX', 'NY', 'FL', 'WA'][i % 5],
        'sale_amount': (Math.random() * 10000).toFixed(2),
        'transaction_count': Math.floor(Math.random() * 5) + 1
      }));

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(largeDataset);

      const mockFile = new File([''], 'large.csv', { type: 'text/csv' });

      const startTime = Date.now();
      const result = await processCSVData(mockFile);
      const endTime = Date.now();

      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle multiple worksheets in Excel files', async () => {
      const sheet1Data = [
        { 'date': '2024-01-01', 'state': 'CA', 'sale_amount': '1000' }
      ];
      const sheet2Data = [
        { 'date': '2024-01-02', 'state': 'TX', 'sale_amount': '2000' }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1', 'Sheet2'],
        Sheets: {
          Sheet1: {},
          Sheet2: {}
        }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any)
        .mockReturnValueOnce(sheet1Data)
        .mockReturnValueOnce(sheet2Data);

      const mockFile = new File([''], 'multi-sheet.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const result = await processCSVData(mockFile);

      expect(result.salesByState.some(state => state.code === 'CA')).toBe(true);
      expect(result.salesByState.some(state => state.code === 'TX')).toBe(true);
    });

    it('should handle progress callbacks', async () => {
      const mockData = [
        { 'date': '2024-01-01', 'state': 'CA', 'sale_amount': '1000' }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockData);

      const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
      const progressCallback = vi.fn();

      await processCSVData(mockFile, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(100);
      expect(progressCallback.mock.calls.length).toBeGreaterThan(5); // Multiple progress updates
    });

    it('should handle currency symbols and formatting', async () => {
      const mockData = [
        {
          'date': '2024-01-01',
          'state': 'CA',
          'sale_amount': '$1,234.56',
          'transaction_count': '2'
        },
        {
          'date': '2024-01-02',
          'state': 'TX',
          'sale_amount': '€999.99',
          'transaction_count': '1'
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockData);

      const mockFile = new File([''], 'currency.csv', { type: 'text/csv' });

      const result = await processCSVData(mockFile);

      expect(result.salesByState.some(state => 
        state.code === 'CA' && state.totalRevenue === 1234.56
      )).toBe(true);
      expect(result.salesByState.some(state => 
        state.code === 'TX' && state.totalRevenue === 999.99
      )).toBe(true);
    });

    it('should handle negative amounts in parentheses', async () => {
      const mockData = [
        {
          'date': '2024-01-01',
          'state': 'CA',
          'sale_amount': '($500.00)',
          'transaction_count': '1'
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockData);

      const mockFile = new File([''], 'negative.csv', { type: 'text/csv' });

      const result = await processCSVData(mockFile);

      // Negative amounts should be handled appropriately
      expect(result.salesByState.length).toBe(0); // Negative amounts might be filtered out
    });

    it('should handle state name to code conversion', async () => {
      const mockData = [
        {
          'date': '2024-01-01',
          'state': 'California',
          'sale_amount': '1000'
        },
        {
          'date': '2024-01-02',
          'state': 'New York',
          'sale_amount': '2000'
        },
        {
          'date': '2024-01-03',
          'state': 'Tex', // Abbreviation
          'sale_amount': '1500'
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockData);

      const mockFile = new File([''], 'states.csv', { type: 'text/csv' });

      const result = await processCSVData(mockFile);

      expect(result.salesByState.some(state => state.code === 'CA')).toBe(true);
      expect(result.salesByState.some(state => state.code === 'NY')).toBe(true);
      expect(result.salesByState.some(state => state.code === 'TX')).toBe(true);
    });

    it('should handle various date formats', async () => {
      const mockData = [
        {
          'date': '01/15/2024',
          'state': 'CA',
          'sale_amount': '1000'
        },
        {
          'date': '01-16-2024',
          'state': 'TX',
          'sale_amount': '2000'
        },
        {
          'date': '2024-01-17',
          'state': 'NY',
          'sale_amount': '1500'
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mockData);

      const mockFile = new File([''], 'dates.csv', { type: 'text/csv' });

      const result = await processCSVData(mockFile);

      expect(result.salesByState.length).toBe(3);
      expect(result.availableYears).toContain('2024');
    });
  });

  describe('error handling', () => {
    it('should handle file read errors', async () => {
      (XLSX.read as any).mockImplementation(() => {
        throw new Error('File read error');
      });

      const mockFile = new File([''], 'error.csv', { type: 'text/csv' });

      await expect(processCSVData(mockFile)).rejects.toThrow('Failed to process file');
    });

    it('should handle malformed Excel files', async () => {
      (XLSX.read as any).mockReturnValue({
        SheetNames: [],
        Sheets: {}
      });

      const mockFile = new File([''], 'malformed.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      await expect(processCSVData(mockFile)).rejects.toThrow();
    });

    it('should handle corrupted data gracefully', async () => {
      const corruptedData = [
        null,
        undefined,
        {},
        { 'random': 'data' }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(corruptedData);

      const mockFile = new File([''], 'corrupted.csv', { type: 'text/csv' });

      await expect(processCSVData(mockFile)).rejects.toThrow();
    });
  });

  describe('performance tests', () => {
    it('should handle memory efficiently with large datasets', async () => {
      // Test with 50k rows
      const veryLargeDataset = Array.from({ length: 50000 }, (_, i) => ({
        'date': `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
        'state': ['CA', 'TX', 'NY', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'][i % 10],
        'sale_amount': (Math.random() * 5000).toFixed(2),
        'transaction_count': Math.floor(Math.random() * 3) + 1
      }));

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(veryLargeDataset);

      const mockFile = new File([''], 'very-large.csv', { type: 'text/csv' });

      // Monitor memory usage (basic check)
      const initialMemory = process.memoryUsage().heapUsed;
      const result = await processCSVData(mockFile);
      const finalMemory = process.memoryUsage().heapUsed;

      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      
      // Memory usage shouldn't grow excessively (allow for 100MB increase)
      expect(finalMemory - initialMemory).toBeLessThan(100 * 1024 * 1024);
    });

    it('should process data in reasonable time', async () => {
      const mediumDataset = Array.from({ length: 25000 }, (_, i) => ({
        'date': `2024-${String(Math.floor(i / 1000) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        'state': ['CA', 'TX', 'NY', 'FL', 'WA'][i % 5],
        'sale_amount': (Math.random() * 2000).toFixed(2)
      }));

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mediumDataset);

      const mockFile = new File([''], 'medium.csv', { type: 'text/csv' });

      const startTime = performance.now();
      const result = await processCSVData(mockFile);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('data quality validation', () => {
    it('should validate required fields are present', async () => {
      const incompleteData = [
        {
          'date': '2024-01-01',
          'state': 'CA'
          // Missing sale_amount
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(incompleteData);

      const mockFile = new File([''], 'incomplete.csv', { type: 'text/csv' });

      await expect(processCSVData(mockFile)).rejects.toThrow();
    });

    it('should handle mixed data quality gracefully', async () => {
      const mixedQualityData = [
        {
          'date': '2024-01-01',
          'state': 'CA',
          'sale_amount': '1000'
        },
        {
          'date': 'invalid-date',
          'state': 'CA',
          'sale_amount': '2000'
        },
        {
          'date': '2024-01-03',
          'state': 'INVALID',
          'sale_amount': '1500'
        },
        {
          'date': '2024-01-04',
          'state': 'TX',
          'sale_amount': 'invalid-amount'
        },
        {
          'date': '2024-01-05',
          'state': 'NY',
          'sale_amount': '3000'
        }
      ];

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(mixedQualityData);

      const mockFile = new File([''], 'mixed-quality.csv', { type: 'text/csv' });

      const result = await processCSVData(mockFile);

      // Should process valid rows and skip invalid ones
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(result.salesByState.some(state => state.code === 'CA')).toBe(true);
      expect(result.salesByState.some(state => state.code === 'NY')).toBe(true);
    });
  });
});