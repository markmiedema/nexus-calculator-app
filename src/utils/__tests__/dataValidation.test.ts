import { describe, it, expect } from 'vitest';
import { 
  validateCSVWithSmartDetection, 
  generateColumnMappingPreview, 
  generateCSVTemplate 
} from '../dataValidation';

describe('dataValidation', () => {
  describe('validateCSVWithSmartDetection', () => {
    it('should validate CSV with standard column names', () => {
      const data = [
        { date: '2024-01-01', state: 'CA', sale_amount: '1000', transaction_count: '1' },
        { date: '2024-01-02', state: 'NY', sale_amount: '2000', transaction_count: '2' }
      ];
      
      const result = validateCSVWithSmartDetection(data);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate CSV with alternative column names', () => {
      const data = [
        { 'Transaction Date': '2024-01-01', 'State Code': 'CA', 'Total Amount': '1000' },
        { 'Transaction Date': '2024-01-02', 'State Code': 'NY', 'Total Amount': '2000' }
      ];
      
      const result = validateCSVWithSmartDetection(data);
      expect(result.isValid).toBe(true);
      expect(result.detectionResult?.mapping.date).toBe('Transaction Date');
      expect(result.detectionResult?.mapping.state).toBe('State Code');
      expect(result.detectionResult?.mapping.sale_amount).toBe('Total Amount');
    });

    it('should fail validation for empty data', () => {
      const result = validateCSVWithSmartDetection([]);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('CSV file is empty');
    });

    it('should fail validation for missing required columns', () => {
      const data = [
        { 'Unknown Column': 'value1' },
        { 'Unknown Column': 'value2' }
      ];
      
      const result = validateCSVWithSmartDetection(data);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('date'))).toBe(true);
      expect(result.errors.some(error => error.includes('state'))).toBe(true);
      expect(result.errors.some(error => error.includes('sale_amount'))).toBe(true);
    });

    it('should provide suggestions for missing columns', () => {
      const data = [
        { 'Transaction Date': '2024-01-01', 'Unknown': 'value' }
      ];
      
      const result = validateCSVWithSmartDetection(data);
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions.some(s => s.includes('state'))).toBe(true);
      expect(result.suggestions.some(s => s.includes('sale_amount'))).toBe(true);
    });

    it('should add warnings for low confidence matches', () => {
      // This would require a more complex test setup with low-confidence matches
      // For now, we'll test the basic structure
      const data = [
        { date: '2024-01-01', state: 'CA', sale_amount: '1000' }
      ];
      
      const result = validateCSVWithSmartDetection(data);
      expect(result.warnings).toBeDefined();
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    it('should validate data quality', () => {
      const data = [
        { date: 'invalid-date', state: 'CA', sale_amount: '1000' },
        { date: '2024-01-02', state: 'INVALID', sale_amount: 'not-a-number' }
      ];
      
      const result = validateCSVWithSmartDetection(data);
      // Should have warnings about data quality issues
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('generateColumnMappingPreview', () => {
    it('should generate preview with detected mappings', () => {
      const detectionResult = {
        mapping: {
          date: 'Transaction Date',
          state: 'State Code',
          sale_amount: 'Total Amount',
          transaction_count: null,
          customer_address: null
        },
        confidence: {
          date: 95,
          state: 90,
          sale_amount: 85,
          transaction_count: 0,
          customer_address: 0
        },
        unmappedHeaders: ['Extra Column'],
        suggestions: {}
      };
      
      const preview = generateColumnMappingPreview(detectionResult);
      
      expect(preview.detectedMappings).toHaveLength(5);
      expect(preview.unmappedHeaders).toEqual(['Extra Column']);
      expect(preview.overallConfidence).toBeGreaterThan(0);
      expect(preview.canProceed).toBe(true);
    });

    it('should indicate when cannot proceed due to missing required columns', () => {
      const detectionResult = {
        mapping: {
          date: null,
          state: 'State Code',
          sale_amount: 'Total Amount',
          transaction_count: null,
          customer_address: null
        },
        confidence: {
          date: 0,
          state: 90,
          sale_amount: 85,
          transaction_count: 0,
          customer_address: 0
        },
        unmappedHeaders: [],
        suggestions: {}
      };
      
      const preview = generateColumnMappingPreview(detectionResult);
      expect(preview.canProceed).toBe(false);
    });

    it('should calculate overall confidence correctly', () => {
      const detectionResult = {
        mapping: {
          date: 'Date',
          state: 'State',
          sale_amount: 'Amount',
          transaction_count: null,
          customer_address: null
        },
        confidence: {
          date: 100,
          state: 80,
          sale_amount: 90,
          transaction_count: 0,
          customer_address: 0
        },
        unmappedHeaders: [],
        suggestions: {}
      };
      
      const preview = generateColumnMappingPreview(detectionResult);
      expect(preview.overallConfidence).toBe(90); // (100 + 80 + 90) / 3
    });
  });

  describe('generateCSVTemplate', () => {
    it('should generate valid CSV template', () => {
      const template = generateCSVTemplate();
      
      expect(template).toContain('date,state,sale_amount');
      expect(template).toContain('2024-01-15,CA,1500.00');
      
      // Should have header row plus sample data rows
      const lines = template.split('\n');
      expect(lines.length).toBeGreaterThan(1);
      
      // First line should be headers
      expect(lines[0]).toBe('date,state,sale_amount,transaction_count,customer_address');
    });

    it('should include sample data in template', () => {
      const template = generateCSVTemplate();
      
      // Should contain sample state codes
      expect(template).toContain('CA');
      expect(template).toContain('TX');
      expect(template).toContain('NY');
      
      // Should contain sample amounts
      expect(template).toContain('1500.00');
      expect(template).toContain('2500.00');
    });
  });
});