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

    it('should not confuse county with transaction count', () => {
      const countyScore = calculateSimilarity('county', 'county');
      const countScore = calculateSimilarity('county', 'count');
      expect(countyScore).toBeGreaterThan(countScore);
    });
  });

  describe('detectColumns', () => {
    it('should detect standard column variations', () => {
      const headers = ['Transaction Date', 'State Code', 'Total Amount', 'Qty', 'Customer City', 'County', 'Zip Code'];
      const result = detectColumns(headers);
      
      expect(result.mapping.date).toBe('Transaction Date');
      expect(result.mapping.state).toBe('State Code');
      expect(result.mapping.sale_amount).toBe('Total Amount');
      expect(result.mapping.transaction_count).toBe('Qty');
      expect(result.mapping.city).toBe('Customer City');
      expect(result.mapping.county).toBe('County');
      expect(result.mapping.zip_code).toBe('Zip Code');
    });

    it('should handle exact matches with high confidence', () => {
      const headers = ['date', 'state', 'sale_amount', 'transaction_count', 'city', 'county', 'zip_code'];
      const result = detectColumns(headers);
      
      expect(result.mapping.date).toBe('date');
      expect(result.confidence.date).toBe(100);
      expect(result.mapping.state).toBe('state');
      expect(result.confidence.state).toBe(100);
      expect(result.mapping.city).toBe('city');
      expect(result.confidence.city).toBe(100);
      expect(result.mapping.county).toBe('county');
      expect(result.confidence.county).toBe(100);
      expect(result.mapping.zip_code).toBe('zip_code');
      expect(result.confidence.zip_code).toBe(100);
    });

    it('should correctly distinguish county from transaction count', () => {
      const headers = ['date', 'state', 'sale_amount', 'county', 'count'];
      const result = detectColumns(headers);
      
      expect(result.mapping.county).toBe('county');
      expect(result.mapping.transaction_count).toBe('count');
    });

    it('should not map headers with low confidence', () => {
      const headers = ['xyz', 'abc', 'def'];
      const result = detectColumns(headers);
      
      expect(result.mapping.date).toBeNull();
      expect(result.mapping.state).toBeNull();
      expect(result.mapping.sale_amount).toBeNull();
      expect(result.mapping.city).toBeNull();
      expect(result.mapping.county).toBeNull();
      expect(result.mapping.zip_code).toBeNull();
    });

    it('should provide suggestions for unmapped columns', () => {
      const headers = ['Transaction Date', 'Unknown Column', 'Revenue', 'Customer City', 'Parish'];
      const result = detectColumns(headers);
      
      expect(result.suggestions.date).toContain('Transaction Date');
      expect(result.suggestions.sale_amount).toContain('Revenue');
      expect(result.suggestions.city).toContain('Customer City');
      expect(result.suggestions.county).toContain('Parish');
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
          city: null,
          county: null,
          zip_code: null
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
          city: null,
          county: null,
          zip_code: null
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
        { 'Transaction Date': '2024-01-01', 'State Code': 'CA', 'Total': '1000', 'Customer City': 'Los Angeles', 'County': 'Los Angeles County', 'Zip': '90210' },
        { 'Transaction Date': '2024-01-02', 'State Code': 'NY', 'Total': '2000', 'Customer City': 'New York', 'County': 'New York County', 'Zip': '10001' }
      ];
      
      const mapping = {
        date: 'Transaction Date',
        state: 'State Code',
        sale_amount: 'Total',
        transaction_count: null,
        city: 'Customer City',
        county: 'County',
        zip_code: 'Zip'
      };
      
      const transformed = transformDataWithMapping(data, mapping);
      
      expect(transformed[0]).toEqual({
        date: '2024-01-01',
        state: 'CA',
        sale_amount: '1000',
        city: 'Los Angeles',
        county: 'Los Angeles County',
        zip_code: '90210'
      });
      
      expect(transformed[1]).toEqual({
        date: '2024-01-02',
        state: 'NY',
        sale_amount: '2000',
        city: 'New York',
        county: 'New York County',
        zip_code: '10001'
      });
    });

    it('should preserve unmapped columns', () => {
      const data = [
        { 'date': '2024-01-01', 'state': 'CA', 'amount': '1000', 'city': 'LA', 'county': 'LA County', 'zip_code': '90210', 'extra': 'value' }
      ];
      
      const mapping = {
        date: 'date',
        state: 'state',
        sale_amount: 'amount',
        transaction_count: null,
        city: 'city',
        county: 'county',
        zip_code: 'zip_code'
      };
      
      const transformed = transformDataWithMapping(data, mapping);
      
      expect(transformed[0]).toEqual({
        date: '2024-01-01',
        state: 'CA',
        sale_amount: '1000',
        city: 'LA',
        county: 'LA County',
        zip_code: '90210',
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
      const optionalColumns = ['transaction_count', 'city', 'county', 'zip_code'];
      
      for (const column of optionalColumns) {
        expect(COLUMN_MAPPINGS).toHaveProperty(column);
        expect(COLUMN_MAPPINGS[column]).toBeInstanceOf(Array);
        expect(COLUMN_MAPPINGS[column].length).toBeGreaterThan(0);
      }
    });

    it('should include city variations', () => {
      expect(COLUMN_MAPPINGS.city).toContain('city');
      expect(COLUMN_MAPPINGS.city).toContain('customer_city');
      expect(COLUMN_MAPPINGS.city).toContain('billing_city');
    });

    it('should include county variations', () => {
      expect(COLUMN_MAPPINGS.county).toContain('county');
      expect(COLUMN_MAPPINGS.county).toContain('customer_county');
      expect(COLUMN_MAPPINGS.county).toContain('billing_county');
      expect(COLUMN_MAPPINGS.county).toContain('parish');
      expect(COLUMN_MAPPINGS.county).toContain('borough');
    });

    it('should include zip code variations', () => {
      expect(COLUMN_MAPPINGS.zip_code).toContain('zip_code');
      expect(COLUMN_MAPPINGS.zip_code).toContain('zip');
      expect(COLUMN_MAPPINGS.zip_code).toContain('postal_code');
      expect(COLUMN_MAPPINGS.zip_code).toContain('zipcode');
    });

    it('should not confuse county with transaction count variations', () => {
      // County should not contain count-related terms
      expect(COLUMN_MAPPINGS.county).not.toContain('count');
      expect(COLUMN_MAPPINGS.county).not.toContain('transaction_count');
      
      // Transaction count should not contain county-related terms
      expect(COLUMN_MAPPINGS.transaction_count).not.toContain('county');
      expect(COLUMN_MAPPINGS.transaction_count).not.toContain('parish');
    });
  });
});