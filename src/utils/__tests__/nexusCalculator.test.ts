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
      expect(result.remainingRevenue).toBe(20000);
      expect(result.remainingTransactions).toBe(50);
    });

    it('should return zero when threshold is met', () => {
      const result = calculateRemainingToNexus('CA', 120000, 250);
      expect(result.remainingRevenue).toBe(0);
      expect(result.remainingTransactions).toBe(0);
    });

    it('should handle states with no transaction threshold', () => {
      const result = calculateRemainingToNexus('AL', 80000, 150);
      expect(result.remainingRevenue).toBe(170000);
      expect(result.remainingTransactions).toBe(null);
    });
  });
});