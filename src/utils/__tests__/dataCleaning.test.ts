import { describe, it, expect } from 'vitest';
import {
  cleanCurrencyValue,
  cleanDateValue,
  cleanStateValue,
  cleanIntegerValue,
  cleanTextValue,
  cleanDataRow,
  cleanDataset
} from '../dataCleaning';

describe('dataCleaning', () => {
  describe('cleanCurrencyValue', () => {
    it('should remove currency symbols', () => {
      const result = cleanCurrencyValue('$1,234.56');
      expect(result.cleanedValue).toBe(1234.56);
      expect(result.wasModified).toBe(true);
    });

    it('should handle negative amounts in parentheses', () => {
      const result = cleanCurrencyValue('($500.00)');
      expect(result.cleanedValue).toBe(-500);
      expect(result.wasModified).toBe(true);
    });

    it('should handle various currency symbols', () => {
      expect(cleanCurrencyValue('€1,000.50').cleanedValue).toBe(1000.5);
      expect(cleanCurrencyValue('£999.99').cleanedValue).toBe(999.99);
      expect(cleanCurrencyValue('¥1000').cleanedValue).toBe(1000);
    });

    it('should handle already clean numbers', () => {
      const result = cleanCurrencyValue('1234.56');
      expect(result.cleanedValue).toBe(1234.56);
      expect(result.wasModified).toBe(false);
    });

    it('should handle invalid values', () => {
      const result = cleanCurrencyValue('not a number');
      expect(result.cleanedValue).toBeNull();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about negative amounts', () => {
      const result = cleanCurrencyValue('-100');
      expect(result.cleanedValue).toBe(-100);
      expect(result.warnings.some(w => w.includes('Negative'))).toBe(true);
    });

    it('should warn about large amounts', () => {
      const result = cleanCurrencyValue('2000000');
      expect(result.cleanedValue).toBe(2000000);
      expect(result.warnings.some(w => w.includes('Large'))).toBe(true);
    });
  });

  describe('cleanDateValue', () => {
    it('should handle MM/DD/YYYY format', () => {
      const result = cleanDateValue('01/15/2024');
      expect(result.cleanedValue).toBe('2024-01-15');
      expect(result.wasModified).toBe(true);
    });

    it('should handle MM/DD/YY format', () => {
      const result = cleanDateValue('01/15/24');
      expect(result.cleanedValue).toBe('2024-01-15');
      expect(result.wasModified).toBe(true);
    });

    it('should handle MM-DD-YYYY format', () => {
      const result = cleanDateValue('01-15-2024');
      expect(result.cleanedValue).toBe('2024-01-15');
      expect(result.wasModified).toBe(true);
    });

    it('should handle Excel serial dates', () => {
      // Excel serial date for 2024-01-01
      const result = cleanDateValue(45292);
      expect(result.cleanedValue).toBe('2024-01-01');
      expect(result.wasModified).toBe(true);
    });

    it('should handle already formatted dates', () => {
      const result = cleanDateValue('2024-01-15');
      expect(result.cleanedValue).toBe('2024-01-15');
      expect(result.wasModified).toBe(false);
    });

    it('should handle invalid dates', () => {
      const result = cleanDateValue('invalid date');
      expect(result.cleanedValue).toBeNull();
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should warn about unusual years', () => {
      const result = cleanDateValue('01/01/1990');
      expect(result.warnings.some(w => w.includes('unusual'))).toBe(true);
    });
  });

  describe('cleanStateValue', () => {
    it('should convert state names to codes', () => {
      const result = cleanStateValue('California');
      expect(result.cleanedValue).toBe('CA');
      expect(result.wasModified).toBe(true);
    });

    it('should handle already valid state codes', () => {
      const result = cleanStateValue('CA');
      expect(result.cleanedValue).toBe('CA');
      expect(result.wasModified).toBe(false);
    });

    it('should handle lowercase state codes', () => {
      const result = cleanStateValue('ca');
      expect(result.cleanedValue).toBe('CA');
      expect(result.wasModified).toBe(true);
    });

    it('should handle common abbreviations', () => {
      expect(cleanStateValue('Calif').cleanedValue).toBe('CA');
      expect(cleanStateValue('Fla').cleanedValue).toBe('FL');
      expect(cleanStateValue('Tex').cleanedValue).toBe('TX');
    });

    it('should handle partial matches with warnings', () => {
      const result = cleanStateValue('New Y');
      expect(result.cleanedValue).toBe('NY');
      expect(result.wasModified).toBe(true);
      expect(result.warnings.some(w => w.includes('Partial match'))).toBe(true);
    });

    it('should handle invalid states', () => {
      const result = cleanStateValue('Invalid State');
      expect(result.cleanedValue).toBeNull();
      expect(result.warnings.some(w => w.includes('Unrecognized'))).toBe(true);
    });
  });

  describe('cleanIntegerValue', () => {
    it('should clean integer values', () => {
      const result = cleanIntegerValue('123');
      expect(result.cleanedValue).toBe(123);
      expect(result.wasModified).toBe(false);
    });

    it('should remove commas from large numbers', () => {
      const result = cleanIntegerValue('1,234');
      expect(result.cleanedValue).toBe(1234);
      expect(result.wasModified).toBe(true);
    });

    it('should default empty values to 1', () => {
      const result = cleanIntegerValue('');
      expect(result.cleanedValue).toBe(1);
      expect(result.wasModified).toBe(true);
      expect(result.warnings.some(w => w.includes('defaulted to 1'))).toBe(true);
    });

    it('should ensure minimum value of 1', () => {
      const result = cleanIntegerValue('-5');
      expect(result.cleanedValue).toBe(1);
      expect(result.wasModified).toBe(true);
      expect(result.warnings.some(w => w.includes('set to 1'))).toBe(true);
    });

    it('should warn about large values', () => {
      const result = cleanIntegerValue('5000');
      expect(result.cleanedValue).toBe(5000);
      expect(result.warnings.some(w => w.includes('Large'))).toBe(true);
    });

    it('should handle invalid integers', () => {
      const result = cleanIntegerValue('not a number');
      expect(result.cleanedValue).toBe(1);
      expect(result.wasModified).toBe(true);
      expect(result.warnings.some(w => w.includes('defaulting to 1'))).toBe(true);
    });
  });

  describe('cleanTextValue', () => {
    it('should trim whitespace', () => {
      const result = cleanTextValue('  Los Angeles  ');
      expect(result.cleanedValue).toBe('Los Angeles');
      expect(result.wasModified).toBe(true);
    });

    it('should normalize multiple spaces', () => {
      const result = cleanTextValue('Los    Angeles');
      expect(result.cleanedValue).toBe('Los Angeles');
      expect(result.wasModified).toBe(true);
    });

    it('should handle null values', () => {
      const result = cleanTextValue(null);
      expect(result.cleanedValue).toBeNull();
      expect(result.wasModified).toBe(false);
    });

    it('should handle empty strings', () => {
      const result = cleanTextValue('');
      expect(result.cleanedValue).toBeNull();
      expect(result.wasModified).toBe(false);
    });
  });

  describe('cleanDataRow', () => {
    it('should clean a complete data row', () => {
      const row = {
        'Transaction Date': '01/15/2024',
        'State': 'California',
        'Amount': '$1,234.56',
        'Qty': '2',
        'City': '  Los Angeles  ',
        'County': 'Los Angeles County',
        'Zip': '90210'
      };

      const mapping = {
        date: 'Transaction Date',
        state: 'State',
        sale_amount: 'Amount',
        transaction_count: 'Qty',
        city: 'City',
        county: 'County',
        zip_code: 'Zip'
      };

      const { cleanedRow, warnings, wasModified } = cleanDataRow(row, mapping);

      expect(cleanedRow.date).toBe('2024-01-15');
      expect(cleanedRow.state).toBe('CA');
      expect(cleanedRow.sale_amount).toBe(1234.56);
      expect(cleanedRow.transaction_count).toBe(2);
      expect(cleanedRow.city).toBe('Los Angeles');
      expect(cleanedRow.county).toBe('Los Angeles County');
      expect(cleanedRow.zip_code).toBe('90210');
      expect(wasModified).toBe(true);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should preserve unmapped columns', () => {
      const row = {
        'date': '2024-01-15',
        'state': 'CA',
        'sale_amount': '1000',
        'extra_column': 'extra_value'
      };

      const mapping = {
        date: 'date',
        state: 'state',
        sale_amount: 'sale_amount',
        transaction_count: null,
        city: null,
        county: null,
        zip_code: null
      };

      const { cleanedRow } = cleanDataRow(row, mapping);

      expect(cleanedRow.extra_column).toBe('extra_value');
    });
  });

  describe('cleanDataset', () => {
    it('should clean an entire dataset', () => {
      const data = [
        {
          'Transaction Date': '01/15/2024',
          'State': 'California',
          'Amount': '$1,234.56',
          'Qty': '1'
        },
        {
          'Transaction Date': '01/16/2024',
          'State': 'TX',
          'Amount': '($500.00)',
          'Qty': '2'
        },
        {
          'Transaction Date': 'invalid',
          'State': 'Invalid',
          'Amount': 'not a number',
          'Qty': '1'
        }
      ];

      const mapping = {
        date: 'Transaction Date',
        state: 'State',
        sale_amount: 'Amount',
        transaction_count: 'Qty',
        city: null,
        county: null,
        zip_code: null
      };

      const { cleanedData, report } = cleanDataset(data, mapping);

      expect(cleanedData.length).toBe(2); // Third row should be skipped
      expect(report.totalRows).toBe(3);
      expect(report.cleanedRows).toBe(2);
      expect(report.modifications.currencySymbolsRemoved).toBeGreaterThan(0);
      expect(report.modifications.negativeParenthesesConverted).toBeGreaterThan(0);
      expect(report.modifications.stateNamesConverted).toBeGreaterThan(0);
      expect(report.modifications.invalidValuesSkipped).toBe(1);
    });

    it('should track different types of modifications', () => {
      const data = [
        {
          'date': '01/15/2024',
          'state': 'California',
          'amount': '$1,000',
          'qty': '1'
        }
      ];

      const mapping = {
        date: 'date',
        state: 'state',
        sale_amount: 'amount',
        transaction_count: 'qty',
        city: null,
        county: null,
        zip_code: null
      };

      const { report } = cleanDataset(data, mapping);

      expect(report.modifications.dateFormatsNormalized).toBeGreaterThan(0);
      expect(report.modifications.stateNamesConverted).toBeGreaterThan(0);
      expect(report.modifications.currencySymbolsRemoved).toBeGreaterThan(0);
    });
  });
});