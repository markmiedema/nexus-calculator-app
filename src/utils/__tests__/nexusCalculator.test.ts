import { describe, it, expect } from 'vitest';
import { calculateNexus, isWithinNexusPeriod, calculateRemainingToNexus } from '../nexusCalculator';
import { MonthlyRevenue } from '../../types';

describe('nexusCalculator', () => {
  describe('calculateNexus', () => {
    const mockMonthlyData: MonthlyRevenue[] = [
      { date: '2024-01-01', revenue: 50000, transactions: 100 },
      { date: '2024-02-01', revenue: 60000, transactions: 120 },
    ];

    it('should identify revenue-based nexus correctly', () => {
      const result = calculateNexus('CA', 110000, 220, mockMonthlyData);
      expect(result.hasNexus).toBe(true);
      expect(result.thresholdType).toBe('revenue');
      expect(result.nexusDate).toBe('2024-02-01');
    });

    it('should not identify nexus when below threshold', () => {
      const result = calculateNexus('CA', 90000, 180, mockMonthlyData);
      expect(result.hasNexus).toBe(false);
    });

    it('should handle states with no sales tax', () => {
      const result = calculateNexus('OR', 1000000, 1000, mockMonthlyData);
      expect(result.hasNexus).toBe(false);
      expect(result.nexusThresholdAmount).toBe(0);
    });
    
    it('should reset counters for each year', () => {
      const multiYearData: MonthlyRevenue[] = [
        { date: '2023-01-01', revenue: 90000, transactions: 180 },
        { date: '2023-02-01', revenue: 90000, transactions: 180 },
        { date: '2024-01-01', revenue: 90000, transactions: 180 },
        { date: '2024-02-01', revenue: 90000, transactions: 180 },
      ];
      
      const result = calculateNexus('TX', 360000, 720, multiYearData);
      
      // Should have nexus in both years
      expect(result.hasNexus).toBe(true);
      expect(result.yearlyBreaches['2023'].hasNexus).toBe(true);
      expect(result.yearlyBreaches['2024'].hasNexus).toBe(true);
      
      // First breach should be in 2023
      expect(result.nexusDate).toBe('2023-02-01');
    });
    
    it('should calculate pre and post nexus revenue correctly', () => {
      const data: MonthlyRevenue[] = [
        { date: '2024-01-01', revenue: 40000, transactions: 80 },
        { date: '2024-02-01', revenue: 70000, transactions: 140 },
        { date: '2024-03-01', revenue: 90000, transactions: 180 },
      ];
      
      const result = calculateNexus('CA', 200000, 400, data);
      
      expect(result.hasNexus).toBe(true);
      expect(result.nexusDate).toBe('2024-02-01');
      expect(result.preNexusRevenue).toBe(40000);
      expect(result.postNexusRevenue).toBe(160000);
    });
  });

  describe('isWithinNexusPeriod', () => {
    it('should return true for dates after nexus date', () => {
      expect(isWithinNexusPeriod('2024-02-15', '2024-02-01')).toBe(true);
    });

    it('should return true for same date as nexus date', () => {
      expect(isWithinNexusPeriod('2024-02-01', '2024-02-01')).toBe(true);
    });

    it('should return false for dates before nexus date', () => {
      expect(isWithinNexusPeriod('2024-01-15', '2024-02-01')).toBe(false);
    });

    it('should return false when no nexus date provided', () => {
      expect(isWithinNexusPeriod('2024-02-15', '')).toBe(false);
    });
  });

  describe('calculateRemainingToNexus', () => {
    it('should calculate remaining amounts correctly', () => {
      const result = calculateRemainingToNexus('CA', 80000, 150);
      expect(result.remainingRevenue).toBe(420000); // CA threshold is 500000
      expect(result.remainingTransactions).toBe(null); // CA has no transaction threshold
    });

    it('should return zero when threshold is met', () => {
      const result = calculateRemainingToNexus('CA', 500000, 250);
      expect(result.remainingRevenue).toBe(0);
      expect(result.remainingTransactions).toBe(null);
    });

    it('should handle states with no transaction threshold', () => {
      const result = calculateRemainingToNexus('AL', 80000, 150);
      expect(result.remainingRevenue).toBe(170000); // AL threshold is 250000
      expect(result.remainingTransactions).toBe(null);
    });
    
    it('should handle states with both thresholds', () => {
      const result = calculateRemainingToNexus('WA', 80000, 150);
      expect(result.remainingRevenue).toBe(20000); // WA threshold is 100000
      expect(result.remainingTransactions).toBe(50); // WA threshold is 200 transactions
    });
  });
});