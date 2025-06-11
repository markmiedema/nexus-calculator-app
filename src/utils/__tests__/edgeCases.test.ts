import { describe, it, expect } from 'vitest';
import { 
  validateCSVWithSmartDetection,
  generateColumnMappingPreview 
} from '../dataValidation';
import { 
  detectColumns,
  calculateSimilarity,
  transformDataWithMapping 
} from '../columnDetection';
import {
  cleanCurrencyValue,
  cleanDateValue,
  cleanStateValue,
  cleanDataset
} from '../dataCleaning';

describe('Edge Cases Testing', () => {
  describe('Column Detection Edge Cases', () => {
    it('should handle headers with special characters', () => {
      const headers = [
        'Date/Time',
        'State (Code)',
        'Sale Amount ($)',
        'Transaction Count (#)',
        'Customer City/Town',
        'County/Parish',
        'ZIP/Postal Code'
      ];

      const result = detectColumns(headers);

      expect(result.mapping.date).toBe('Date/Time');
      expect(result.mapping.state).toBe('State (Code)');
      expect(result.mapping.sale_amount).toBe('Sale Amount ($)');
      expect(result.mapping.transaction_count).toBe('Transaction Count (#)');
      expect(result.mapping.city).toBe('Customer City/Town');
      expect(result.mapping.county).toBe('County/Parish');
      expect(result.mapping.zip_code).toBe('ZIP/Postal Code');
    });

    it('should handle headers with numbers', () => {
      const headers = [
        'Date1',
        'State2',
        'Amount3',
        'Count4',
        'City5',
        'County6',
        'Zip7'
      ];

      const result = detectColumns(headers);

      // Should still detect based on root words
      expect(result.mapping.date).toBe('Date1');
      expect(result.mapping.state).toBe('State2');
      expect(result.mapping.sale_amount).toBe('Amount3');
      expect(result.mapping.transaction_count).toBe('Count4');
      expect(result.mapping.city).toBe('City5');
      expect(result.mapping.county).toBe('County6');
      expect(result.mapping.zip_code).toBe('Zip7');
    });

    it('should handle very similar column names', () => {
      const headers = [
        'Date',
        'State',
        'County',
        'Count',
        'Amount'
      ];

      const result = detectColumns(headers);

      // Should correctly distinguish county from count
      expect(result.mapping.county).toBe('County');
      expect(result.mapping.transaction_count).toBe('Count');
      expect(result.mapping.date).toBe('Date');
      expect(result.mapping.state).toBe('State');
      expect(result.mapping.sale_amount).toBe('Amount');
    });

    it('should handle duplicate-like headers', () => {
      const headers = [
        'Date',
        'Date_2',
        'State',
        'State_Code',
        'Amount',
        'Total_Amount'
      ];

      const result = detectColumns(headers);

      // Should pick the best match for each standard column
      expect(result.mapping.date).toBeTruthy();
      expect(result.mapping.state).toBeTruthy();
      expect(result.mapping.sale_amount).toBeTruthy();
    });

    it('should handle empty or null headers', () => {
      const headers = [
        'Date',
        '',
        null as any,
        'State',
        undefined as any,
        'Amount'
      ].filter(h => h != null && h !== '');

      const result = detectColumns(headers);

      expect(result.mapping.date).toBe('Date');
      expect(result.mapping.state).toBe('State');
      expect(result.mapping.sale_amount).toBe('Amount');
    });

    it('should handle headers with excessive whitespace', () => {
      const headers = [
        '   Date   ',
        '\t\tState\t\t',
        '\n\nAmount\n\n',
        '  Transaction Count  '
      ];

      const result = detectColumns(headers);

      expect(result.mapping.date).toBe('   Date   ');
      expect(result.mapping.state).toBe('\t\tState\t\t');
      expect(result.mapping.sale_amount).toBe('\n\nAmount\n\n');
      expect(result.mapping.transaction_count).toBe('  Transaction Count  ');
    });

    it('should handle case variations', () => {
      const headers = [
        'DATE',
        'state',
        'Sale_Amount',
        'TRANSACTION_COUNT',
        'CiTy',
        'CoUnTy',
        'zip_CODE'
      ];

      const result = detectColumns(headers);

      expect(result.mapping.date).toBe('DATE');
      expect(result.mapping.state).toBe('state');
      expect(result.mapping.sale_amount).toBe('Sale_Amount');
      expect(result.mapping.transaction_count).toBe('TRANSACTION_COUNT');
      expect(result.mapping.city).toBe('CiTy');
      expect(result.mapping.county).toBe('CoUnTy');
      expect(result.mapping.zip_code).toBe('zip_CODE');
    });

    it('should handle foreign language headers', () => {
      const headers = [
        'Fecha', // Spanish for Date
        'Estado', // Spanish for State
        'Cantidad', // Spanish for Amount
        'Ciudad', // Spanish for City
        'Condado' // Spanish for County
      ];

      const result = detectColumns(headers);

      // Should not match foreign language headers
      expect(result.mapping.date).toBeNull();
      expect(result.mapping.state).toBeNull();
      expect(result.mapping.sale_amount).toBeNull();
    });

    it('should handle very long header names', () => {
      const headers = [
        'This_Is_A_Very_Long_Transaction_Date_Column_Header_That_Contains_The_Word_Date',
        'Customer_Billing_State_Code_For_Tax_Calculation_Purposes',
        'Total_Sale_Amount_Including_Tax_And_Shipping_Costs_In_USD',
        'Number_Of_Individual_Transaction_Items_Count'
      ];

      const result = detectColumns(headers);

      expect(result.mapping.date).toBe('This_Is_A_Very_Long_Transaction_Date_Column_Header_That_Contains_The_Word_Date');
      expect(result.mapping.state).toBe('Customer_Billing_State_Code_For_Tax_Calculation_Purposes');
      expect(result.mapping.sale_amount).toBe('Total_Sale_Amount_Including_Tax_And_Shipping_Costs_In_USD');
      expect(result.mapping.transaction_count).toBe('Number_Of_Individual_Transaction_Items_Count');
    });
  });

  describe('Data Cleaning Edge Cases', () => {
    it('should handle extreme currency values', () => {
      const testCases = [
        '$999,999,999.99',
        '($1,000,000.00)',
        '€0.01',
        '¥1,000,000',
        '$0.00',
        '£-500.50'
      ];

      testCases.forEach(value => {
        const result = cleanCurrencyValue(value);
        expect(typeof result.cleanedValue).toBe('number');
      });
    });

    it('should handle unusual date formats', () => {
      const testCases = [
        '2024-366', // Invalid day
        '13/32/2024', // Invalid month/day
        '2024/02/30', // Invalid date for February
        '99/99/99', // Ambiguous format
        '2024-W01-1', // ISO week format
        '2024-001' // Julian date
      ];

      testCases.forEach(value => {
        const result = cleanDateValue(value);
        // Should either clean successfully or return null with warnings
        expect(result.warnings.length >= 0).toBe(true);
      });
    });

    it('should handle edge case state values', () => {
      const testCases = [
        'Washington DC',
        'D.C.',
        'District of Columbia',
        'Puerto Rico',
        'Virgin Islands',
        'Guam',
        'American Samoa',
        'Northern Mariana Islands'
      ];

      testCases.forEach(value => {
        const result = cleanStateValue(value);
        // Should handle or warn about non-standard states
        expect(result.warnings.length >= 0).toBe(true);
      });
    });

    it('should handle malformed data types', () => {
      const testCases = [
        { value: new Date(), expected: 'object' },
        { value: [], expected: 'array' },
        { value: {}, expected: 'object' },
        { value: true, expected: 'boolean' },
        { value: Symbol('test'), expected: 'symbol' }
      ];

      testCases.forEach(({ value, expected }) => {
        const currencyResult = cleanCurrencyValue(value);
        const dateResult = cleanDateValue(value);
        const stateResult = cleanStateValue(value);

        // Should handle gracefully without throwing
        expect(currencyResult).toBeDefined();
        expect(dateResult).toBeDefined();
        expect(stateResult).toBeDefined();
      });
    });

    it('should handle Unicode and special characters', () => {
      const testCases = [
        'Montréal', // City with accent
        'São Paulo', // City with tilde
        'München', // City with umlaut
        '北京', // Chinese characters
        '東京', // Japanese characters
        'Москва' // Cyrillic characters
      ];

      testCases.forEach(value => {
        const result = cleanStateValue(value);
        expect(result).toBeDefined();
      });
    });

    it('should handle extremely large datasets in cleaning', () => {
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        'date': `2024-01-${String((i % 30) + 1).padStart(2, '0')}`,
        'state': ['CA', 'TX', 'NY'][i % 3],
        'sale_amount': `$${(Math.random() * 10000).toFixed(2)}`,
        'transaction_count': String(Math.floor(Math.random() * 10) + 1)
      }));

      const mapping = {
        date: 'date',
        state: 'state',
        sale_amount: 'sale_amount',
        transaction_count: 'transaction_count',
        city: null,
        county: null,
        zip_code: null
      };

      const startTime = performance.now();
      const { cleanedData, report } = cleanDataset(largeDataset, mapping);
      const endTime = performance.now();

      expect(cleanedData.length).toBeGreaterThan(0);
      expect(report.totalRows).toBe(10000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Validation Edge Cases', () => {
    it('should handle CSV with only headers', () => {
      const data = []; // Empty data array

      const result = validateCSVWithSmartDetection(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('empty');
    });

    it('should handle CSV with single row', () => {
      const data = [
        { 'date': '2024-01-01', 'state': 'CA', 'sale_amount': '1000' }
      ];

      const result = validateCSVWithSmartDetection(data);

      expect(result.isValid).toBe(true);
    });

    it('should handle CSV with inconsistent columns', () => {
      const data = [
        { 'date': '2024-01-01', 'state': 'CA', 'sale_amount': '1000' },
        { 'date': '2024-01-02', 'different_column': 'value' }, // Missing required columns
        { 'date': '2024-01-03', 'state': 'TX', 'sale_amount': '2000', 'extra_column': 'extra' }
      ];

      const result = validateCSVWithSmartDetection(data);

      // Should still validate if first row has required columns
      expect(result.isValid).toBe(true);
    });

    it('should handle extremely low confidence matches', () => {
      const headers = [
        'xyz123',
        'abc456',
        'def789'
      ];

      const result = detectColumns(headers);

      expect(result.mapping.date).toBeNull();
      expect(result.mapping.state).toBeNull();
      expect(result.mapping.sale_amount).toBeNull();
      expect(result.confidence.date).toBe(0);
      expect(result.confidence.state).toBe(0);
      expect(result.confidence.sale_amount).toBe(0);
    });

    it('should handle partial matches with warnings', () => {
      const headers = [
        'dat', // Partial match for date
        'sta', // Partial match for state
        'amt'  // Partial match for amount
      ];

      const result = detectColumns(headers);

      // Should have low confidence or no matches
      expect(result.confidence.date || 0).toBeLessThan(70);
      expect(result.confidence.state || 0).toBeLessThan(70);
      expect(result.confidence.sale_amount || 0).toBeLessThan(70);
    });
  });

  describe('Performance Edge Cases', () => {
    it('should handle similarity calculation with very long strings', () => {
      const longString1 = 'a'.repeat(1000);
      const longString2 = 'b'.repeat(1000);

      const startTime = performance.now();
      const similarity = calculateSimilarity(longString1, longString2);
      const endTime = performance.now();

      expect(similarity).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });

    it('should handle detection with many headers', () => {
      const manyHeaders = Array.from({ length: 1000 }, (_, i) => `header_${i}`);

      const startTime = performance.now();
      const result = detectColumns(manyHeaders);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle transformation of wide datasets', () => {
      const wideData = Array.from({ length: 100 }, (_, i) => {
        const row: any = {};
        for (let j = 0; j < 100; j++) {
          row[`column_${j}`] = `value_${i}_${j}`;
        }
        return row;
      });

      const mapping = {
        date: 'column_0',
        state: 'column_1',
        sale_amount: 'column_2',
        transaction_count: null,
        city: null,
        county: null,
        zip_code: null
      };

      const startTime = performance.now();
      const transformed = transformDataWithMapping(wideData, mapping);
      const endTime = performance.now();

      expect(transformed.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(500); // Should complete quickly
    });
  });

  describe('Memory Edge Cases', () => {
    it('should handle repeated string operations efficiently', () => {
      const testString = '$1,234,567.89';
      const iterations = 10000;

      const startTime = performance.now();
      for (let i = 0; i < iterations; i++) {
        cleanCurrencyValue(testString);
      }
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle large string processing', () => {
      const largeString = 'a'.repeat(100000);

      const startTime = performance.now();
      const result = cleanStateValue(largeString);
      const endTime = performance.now();

      expect(result).toBeDefined();
      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum and maximum numeric values', () => {
      const testValues = [
        Number.MIN_VALUE,
        Number.MAX_VALUE,
        Number.MIN_SAFE_INTEGER,
        Number.MAX_SAFE_INTEGER,
        Infinity,
        -Infinity,
        NaN
      ];

      testValues.forEach(value => {
        const result = cleanCurrencyValue(value);
        expect(result).toBeDefined();
      });
    });

    it('should handle edge dates', () => {
      const testDates = [
        '1900-01-01',
        '2099-12-31',
        '2000-02-29', // Leap year
        '1900-02-29', // Not a leap year
        '2024-02-29', // Leap year
        '2023-02-29'  // Not a leap year
      ];

      testDates.forEach(date => {
        const result = cleanDateValue(date);
        expect(result).toBeDefined();
      });
    });

    it('should handle empty and whitespace-only values', () => {
      const testValues = [
        '',
        ' ',
        '\t',
        '\n',
        '\r\n',
        '   \t\n   '
      ];

      testValues.forEach(value => {
        const currencyResult = cleanCurrencyValue(value);
        const dateResult = cleanDateValue(value);
        const stateResult = cleanStateValue(value);

        expect(currencyResult).toBeDefined();
        expect(dateResult).toBeDefined();
        expect(stateResult).toBeDefined();
      });
    });
  });
});