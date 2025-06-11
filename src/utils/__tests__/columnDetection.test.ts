import { describe, it, expect } from 'vitest';
import { 
  calculateSimilarity, 
  detectColumns, 
  validateDetection, 
  transformDataWithMapping,
  COLUMN_MAPPINGS 
} from '../columnDetection';

describe('columnDetection', () => {
  describe('calculateSimilarity', () => {
    it('should return 100 for exact matches', () => {
      expect(calculateSimilarity('date', 'date')).toBe(100);
      expect(calculateSimilarity('Date', 'date')).toBe(100);
      expect(calculateSimilarity('DATE', 'date')).toBe(100);
    });

    it('should return 95 for matches after cleaning separators', () => {
      expect(calculateSimilarity('sale_amount', 'sale amount')).toBe(95);
      expect(calculateSimilarity('transaction-count', 'transaction_count')).toBe(95);
    });

    it('should return 90 for whole word matches', () => {
      expect(calculateSimilarity('transaction date', 'date')).toBe(90);
      expect(calculateSimilarity('total sale amount', 'sale amount')).toBe(90);
    });

    it('should return high scores for substring matches', () => {
      const score = calculateSimilarity('invoice_amount', 'amount');
      expect(score).toBeGreaterThan(70);
    });

    it('should return low scores for poor matches', () => {
      expect(calculateSimilarity('xyz', 'date')).toBeLessThan(30);
    });
  });

  describe('detectColumns', () => {
    it('should detect standard column variations', () => {
      const headers = ['Transaction Date', 'State Code', 'Total Amount', 'Qty'];
      const result = detectColumns(headers);
      
      expect(result.mapping.date).toBe('Transaction Date');
      expect(result.mapping.state).toBe('State Code');
      expect(result.mapping.sale_amount).toBe('Total Amount');
      expect(result.mapping.transaction_count).toBe('Qty');
    });

    it('should handle exact matches with high confidence', () => {
      const headers = ['date', 'state', 'sale_amount', 'transaction_count'];
      const result = detectColumns(headers);
      
      expect(result.mapping.date).toBe('date');
      expect(result.confidence.date).toBe(100);
      expect(result.mapping.state).toBe('state');
      expect(result.confidence.state).toBe(100);
    });

    it('should not map headers with low confidence', () => {
      const headers = ['xyz', 'abc', 'def'];
      const result = detectColumns(headers);
      
      expect(result.mapping.date).toBeNull();
      expect(result.mapping.state).toBeNull();
      expect(result.mapping.sale_amount).toBeNull();
    });

    it('should provide suggestions for unmapped columns', () => {
      const headers = ['Transaction Date', 'Unknown Column', 'Revenue'];
      const result = detectColumns(headers);
      
      expect(result.suggestions.date).toContain('Transaction Date');
      expect(result.suggestions.sale_amount).toContain('Revenue');
    });

    it('should identify unmapped headers', () => {
      const headers = ['date', 'state', 'sale_amount', 'extra_column'];
      const result = detectColumns(headers);
      
      expect(result.unmappedHeaders).toContain('extra_column');
    });

    it('should not reuse headers for multiple mappings', () => {
      const headers = ['amount', 'total', 'value'];
      const result = detectColumns(headers);
      
      // Only one should be mapped to sale_amount
      const mappedHeaders = Object.values(result.mapping).filter(h => h !== null);
      const uniqueHeaders = new Set(mappedHeaders);
      expect(mappedHeaders.length).toBe(uniqueHeaders.size);
    });
  });

  describe('validateDetection', () => {
    it('should validate when all required columns are detected', () => {
      const result = {
        mapping: {
          date: 'Transaction Date',
          state: 'State',
          sale_amount: 'Amount',
          transaction_count: null,
          customer_address: null
        },
        confidence: {},
        unmappedHeaders: [],
        suggestions: {}
      };
      
      const validation = validateDetection(result);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should fail validation when required columns are missing', () => {
      const result = {
        mapping: {
          date: null,
          state: 'State',
          sale_amount: 'Amount',
          transaction_count: null,
          customer_address: null
        },
        confidence: {},
        unmappedHeaders: [],
        suggestions: {}
      };
      
      const validation = validateDetection(result);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain("Required column 'date' could not be detected");
    });
  });

  describe('transformDataWithMapping', () => {
    it('should transform data using column mapping', () => {
      const data = [
        { 'Transaction Date': '2024-01-01', 'State Code': 'CA', 'Total': '1000' },
        { 'Transaction Date': '2024-01-02', 'State Code': 'NY', 'Total': '2000' }
      ];
      
      const mapping = {
        date: 'Transaction Date',
        state: 'State Code',
        sale_amount: 'Total',
        transaction_count: null,
        customer_address: null
      };
      
      const transformed = transformDataWithMapping(data, mapping);
      
      expect(transformed[0]).toEqual({
        date: '2024-01-01',
        state: 'CA',
        sale_amount: '1000'
      });
      
      expect(transformed[1]).toEqual({
        date: '2024-01-02',
        state: 'NY',
        sale_amount: '2000'
      });
    });

    it('should preserve unmapped columns', () => {
      const data = [
        { 'date': '2024-01-01', 'state': 'CA', 'amount': '1000', 'extra': 'value' }
      ];
      
      const mapping = {
        date: 'date',
        state: 'state',
        sale_amount: 'amount',
        transaction_count: null,
        customer_address: null
      };
      
      const transformed = transformDataWithMapping(data, mapping);
      
      expect(transformed[0]).toEqual({
        date: '2024-01-01',
        state: 'CA',
        sale_amount: '1000',
        extra: 'value'
      });
    });
  });

  describe('COLUMN_MAPPINGS', () => {
    it('should contain all required standard columns', () => {
      const requiredColumns = ['date', 'state', 'sale_amount'];
      
      for (const column of requiredColumns) {
        expect(COLUMN_MAPPINGS).toHaveProperty(column);
        expect(COLUMN_MAPPINGS[column]).toBeInstanceOf(Array);
        expect(COLUMN_MAPPINGS[column].length).toBeGreaterThan(0);
      }
    });

    it('should have variations for optional columns', () => {
      const optionalColumns = ['transaction_count', 'customer_address'];
      
      for (const column of optionalColumns) {
        expect(COLUMN_MAPPINGS).toHaveProperty(column);
        expect(COLUMN_MAPPINGS[column]).toBeInstanceOf(Array);
        expect(COLUMN_MAPPINGS[column].length).toBeGreaterThan(0);
      }
    });
  });
});