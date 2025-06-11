import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { processCSVData } from '../csvProcessor';
import { cleanDataset } from '../dataCleaning';
import { detectColumns } from '../columnDetection';
import * as XLSX from 'xlsx';

// Mock XLSX for testing
vi.mock('xlsx', () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn()
  }
}));

describe('Large File Performance Tests', () => {
  let performanceData: Array<{ size: number; time: number; memory: number }> = [];

  beforeEach(() => {
    vi.clearAllMocks();
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  const generateLargeDataset = (size: number) => {
    return Array.from({ length: size }, (_, i) => ({
      'Transaction Date': `2024-${String(Math.floor(i / 1000) % 12 + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      'State': ['CA', 'TX', 'NY', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'][i % 10],
      'Sales Amount ($)': `$${(Math.random() * 5000 + 100).toFixed(2)}`,
      'Transaction Count': String(Math.floor(Math.random() * 5) + 1),
      'Customer City': ['Los Angeles', 'Houston', 'New York', 'Miami', 'Seattle'][i % 5],
      'County': ['Los Angeles County', 'Harris County', 'New York County', 'Miami-Dade County', 'King County'][i % 5],
      'Zip Code': String(10000 + (i % 90000))
    }));
  };

  const measurePerformance = async (testName: string, testFunction: () => Promise<any>) => {
    const startTime = performance.now();
    const startMemory = process.memoryUsage().heapUsed;

    const result = await testFunction();

    const endTime = performance.now();
    const endMemory = process.memoryUsage().heapUsed;

    const duration = endTime - startTime;
    const memoryUsed = endMemory - startMemory;

    console.log(`${testName}: ${duration.toFixed(2)}ms, Memory: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);

    return { result, duration, memoryUsed };
  };

  describe('CSV Processing Performance', () => {
    it('should process 10k rows efficiently', async () => {
      const dataset = generateLargeDataset(10000);

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(dataset);

      const mockFile = new File([''], '10k-rows.csv', { type: 'text/csv' });

      const { result, duration, memoryUsed } = await measurePerformance(
        '10k rows processing',
        () => processCSVData(mockFile)
      );

      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(memoryUsed).toBeLessThan(50 * 1024 * 1024); // Should use less than 50MB

      performanceData.push({ size: 10000, time: duration, memory: memoryUsed });
    });

    it('should process 25k rows efficiently', async () => {
      const dataset = generateLargeDataset(25000);

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(dataset);

      const mockFile = new File([''], '25k-rows.csv', { type: 'text/csv' });

      const { result, duration, memoryUsed } = await measurePerformance(
        '25k rows processing',
        () => processCSVData(mockFile)
      );

      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(memoryUsed).toBeLessThan(100 * 1024 * 1024); // Should use less than 100MB

      performanceData.push({ size: 25000, time: duration, memory: memoryUsed });
    });

    it('should process 50k rows efficiently', async () => {
      const dataset = generateLargeDataset(50000);

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(dataset);

      const mockFile = new File([''], '50k-rows.csv', { type: 'text/csv' });

      const { result, duration, memoryUsed } = await measurePerformance(
        '50k rows processing',
        () => processCSVData(mockFile)
      );

      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(20000); // Should complete within 20 seconds
      expect(memoryUsed).toBeLessThan(200 * 1024 * 1024); // Should use less than 200MB

      performanceData.push({ size: 50000, time: duration, memory: memoryUsed });
    });

    it('should show linear or sub-linear performance scaling', () => {
      if (performanceData.length >= 2) {
        // Check that performance scales reasonably
        const sorted = performanceData.sort((a, b) => a.size - b.size);
        
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const curr = sorted[i];
          
          const sizeRatio = curr.size / prev.size;
          const timeRatio = curr.time / prev.time;
          const memoryRatio = curr.memory / prev.memory;
          
          // Time should scale sub-linearly or linearly (not exponentially)
          expect(timeRatio).toBeLessThan(sizeRatio * 2);
          
          // Memory should scale reasonably
          expect(memoryRatio).toBeLessThan(sizeRatio * 1.5);
          
          console.log(`Size ratio: ${sizeRatio.toFixed(2)}, Time ratio: ${timeRatio.toFixed(2)}, Memory ratio: ${memoryRatio.toFixed(2)}`);
        }
      }
    });
  });

  describe('Column Detection Performance', () => {
    it('should handle detection with many columns efficiently', async () => {
      const manyHeaders = Array.from({ length: 500 }, (_, i) => `column_${i}`);
      manyHeaders.splice(0, 0, 'Transaction Date', 'State', 'Sales Amount');

      const { result, duration } = await measurePerformance(
        'Column detection with 500 headers',
        async () => detectColumns(manyHeaders)
      );

      expect(result.mapping.date).toBe('Transaction Date');
      expect(result.mapping.state).toBe('State');
      expect(result.mapping.sale_amount).toBe('Sales Amount');
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle detection with very long header names', async () => {
      const longHeaders = [
        'A'.repeat(1000) + '_Transaction_Date_' + 'B'.repeat(1000),
        'C'.repeat(1000) + '_State_Code_' + 'D'.repeat(1000),
        'E'.repeat(1000) + '_Sale_Amount_' + 'F'.repeat(1000)
      ];

      const { result, duration } = await measurePerformance(
        'Column detection with very long headers',
        async () => detectColumns(longHeaders)
      );

      expect(result.mapping.date).toBeTruthy();
      expect(result.mapping.state).toBeTruthy();
      expect(result.mapping.sale_amount).toBeTruthy();
      expect(duration).toBeLessThan(500); // Should complete within 0.5 seconds
    });
  });

  describe('Data Cleaning Performance', () => {
    it('should clean large datasets efficiently', async () => {
      const largeDataset = generateLargeDataset(30000);
      
      const mapping = {
        date: 'Transaction Date',
        state: 'State',
        sale_amount: 'Sales Amount ($)',
        transaction_count: 'Transaction Count',
        city: 'Customer City',
        county: 'County',
        zip_code: 'Zip Code'
      };

      const { result, duration, memoryUsed } = await measurePerformance(
        'Data cleaning for 30k rows',
        async () => cleanDataset(largeDataset, mapping)
      );

      expect(result.cleanedData.length).toBeGreaterThan(0);
      expect(result.report.totalRows).toBe(30000);
      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(memoryUsed).toBeLessThan(150 * 1024 * 1024); // Should use less than 150MB
    });

    it('should handle repeated cleaning operations efficiently', async () => {
      const dataset = generateLargeDataset(1000);
      const mapping = {
        date: 'Transaction Date',
        state: 'State',
        sale_amount: 'Sales Amount ($)',
        transaction_count: 'Transaction Count',
        city: 'Customer City',
        county: 'County',
        zip_code: 'Zip Code'
      };

      const iterations = 50;

      const { duration } = await measurePerformance(
        `${iterations} cleaning operations`,
        async () => {
          for (let i = 0; i < iterations; i++) {
            cleanDataset(dataset, mapping);
          }
        }
      );

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Memory Management', () => {
    it('should not leak memory during repeated operations', async () => {
      const dataset = generateLargeDataset(5000);
      const mapping = {
        date: 'Transaction Date',
        state: 'State',
        sale_amount: 'Sales Amount ($)',
        transaction_count: 'Transaction Count',
        city: 'Customer City',
        county: 'County',
        zip_code: 'Zip Code'
      };

      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple operations
      for (let i = 0; i < 10; i++) {
        cleanDataset(dataset, mapping);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle progressive data size increases', async () => {
      const sizes = [1000, 5000, 10000, 20000];
      const memoryUsages: number[] = [];

      for (const size of sizes) {
        const dataset = generateLargeDataset(size);
        const mapping = {
          date: 'Transaction Date',
          state: 'State',
          sale_amount: 'Sales Amount ($)',
          transaction_count: 'Transaction Count',
          city: 'Customer City',
          county: 'County',
          zip_code: 'Zip Code'
        };

        const startMemory = process.memoryUsage().heapUsed;
        cleanDataset(dataset, mapping);
        const endMemory = process.memoryUsage().heapUsed;

        const memoryUsed = endMemory - startMemory;
        memoryUsages.push(memoryUsed);

        console.log(`Size: ${size}, Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
      }

      // Memory usage should scale reasonably with data size
      for (let i = 1; i < memoryUsages.length; i++) {
        const sizeRatio = sizes[i] / sizes[i - 1];
        const memoryRatio = memoryUsages[i] / memoryUsages[i - 1];
        
        // Memory should not scale exponentially
        expect(memoryRatio).toBeLessThan(sizeRatio * 2);
      }
    });
  });

  describe('Stress Testing', () => {
    it('should handle maximum realistic file size', async () => {
      // Test with 100k rows (realistic maximum for browser processing)
      const dataset = generateLargeDataset(100000);

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(dataset);

      const mockFile = new File([''], '100k-rows.csv', { type: 'text/csv' });

      const { result, duration, memoryUsed } = await measurePerformance(
        '100k rows stress test',
        () => processCSVData(mockFile)
      );

      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(60000); // Should complete within 1 minute
      expect(memoryUsed).toBeLessThan(500 * 1024 * 1024); // Should use less than 500MB
    });

    it('should handle wide datasets (many columns)', async () => {
      const wideDataset = Array.from({ length: 5000 }, (_, i) => {
        const row: any = {};
        
        // Add required columns
        row['Transaction Date'] = `2024-01-${String((i % 28) + 1).padStart(2, '0')}`;
        row['State'] = ['CA', 'TX', 'NY'][i % 3];
        row['Sales Amount ($)'] = `$${(Math.random() * 1000).toFixed(2)}`;
        
        // Add many extra columns
        for (let j = 0; j < 100; j++) {
          row[`extra_column_${j}`] = `value_${i}_${j}`;
        }
        
        return row;
      });

      const mockWorkbook = {
        SheetNames: ['Sheet1'],
        Sheets: { Sheet1: {} }
      };

      (XLSX.read as any).mockReturnValue(mockWorkbook);
      (XLSX.utils.sheet_to_json as any).mockReturnValue(wideDataset);

      const mockFile = new File([''], 'wide-dataset.csv', { type: 'text/csv' });

      const { result, duration } = await measurePerformance(
        'Wide dataset (100+ columns)',
        () => processCSVData(mockFile)
      );

      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
    });
  });
});