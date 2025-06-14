import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  calculateNexus, 
  isWithinNexusPeriod, 
  calculateRemainingToNexus, 
  calculateRolling12MonthNexus,
  getDaysDifference
} from '../nexusCalculator';
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

  describe('rolling 12-month nexus calculation', () => {
    it('should detect nexus with transactions spanning exactly 12 months', () => {
      const rollingData: MonthlyRevenue[] = [
        { date: '2023-01-15', revenue: 30000, transactions: 60 },
        { date: '2023-04-15', revenue: 30000, transactions: 60 },
        { date: '2023-07-15', revenue: 30000, transactions: 60 },
        { date: '2023-10-15', revenue: 30000, transactions: 60 },
        { date: '2024-01-14', revenue: 30000, transactions: 60 }, // Just under 365 days from first transaction
      ];
      
      const result = calculateNexus('WA', 150000, 300, rollingData);
      
      expect(result.hasNexus).toBe(true);
      expect(result.rollingBreachDate).toBe('2024-01-14');
      expect(result.rollingBreachType).toBe('revenue');
    });
    
    it('should not include transactions outside the 365-day window', () => {
      const rollingData: MonthlyRevenue[] = [
        { date: '2023-01-01', revenue: 60000, transactions: 120 },
        { date: '2024-01-02', revenue: 60000, transactions: 120 }, // 367 days after first transaction
      ];
      
      const result = calculateNexus('WA', 120000, 240, rollingData);
      
      // Should not have nexus because transactions are more than 365 days apart
      expect(result.rollingBreachDate).toBe(null);
    });
    
    it('should handle leap years correctly', () => {
      const leapYearData: MonthlyRevenue[] = [
        { date: '2024-02-29', revenue: 50000, transactions: 100 }, // Leap day
        { date: '2024-06-15', revenue: 50000, transactions: 100 },
        { date: '2025-02-28', revenue: 50000, transactions: 100 }, // 365 days after first transaction
      ];
      
      const result = calculateNexus('WA', 150000, 300, leapYearData);
      
      expect(result.hasNexus).toBe(true);
      expect(result.rollingBreachDate).toBe('2025-02-28');
    });
    
    it('should handle multiple transactions on the same day', () => {
      const sameDay: MonthlyRevenue[] = [
        // Multiple transactions on the same day should be combined
        { date: '2024-01-01', revenue: 30000, transactions: 60 },
        { date: '2024-01-01', revenue: 30000, transactions: 60 },
        { date: '2024-01-01', revenue: 30000, transactions: 60 },
        { date: '2024-01-01', revenue: 30000, transactions: 60 },
      ];
      
      // Note: In real implementation, these would be combined before calling calculateNexus
      // This test is to verify the logic works even if they're not combined
      const result = calculateNexus('WA', 120000, 240, sameDay);
      
      expect(result.hasNexus).toBe(true);
      expect(result.nexusDate).toBe('2024-01-01');
    });
    
    it('should detect transaction-count based nexus in rolling window', () => {
      const transactionData: MonthlyRevenue[] = [
        { date: '2023-06-01', revenue: 10000, transactions: 50 },
        { date: '2023-09-01', revenue: 10000, transactions: 50 },
        { date: '2023-12-01', revenue: 10000, transactions: 50 },
        { date: '2024-03-01', revenue: 10000, transactions: 50 },
        { date: '2024-05-15', revenue: 10000, transactions: 50 }, // 349 days after first transaction
      ];
      
      const result = calculateNexus('WA', 50000, 250, transactionData);
      
      expect(result.hasNexus).toBe(true);
      expect(result.rollingBreachType).toBe('transactions');
      expect(result.rollingBreachDate).toBe('2024-05-15');
    });
    
    it('should handle sparse transaction patterns', () => {
      const sparseData: MonthlyRevenue[] = [
        { date: '2023-01-15', revenue: 10000, transactions: 20 },
        // Large gap
        { date: '2023-11-15', revenue: 10000, transactions: 20 },
        { date: '2023-12-15', revenue: 90000, transactions: 180 },
      ];
      
      const result = calculateNexus('WA', 110000, 220, sparseData);
      
      expect(result.hasNexus).toBe(true);
      expect(result.rollingBreachDate).toBe('2023-12-15');
    });
    
    it('should handle edge case with exactly 365 days', () => {
      const edgeData: MonthlyRevenue[] = [
        { date: '2023-01-01', revenue: 50000, transactions: 100 },
        { date: '2024-01-01', revenue: 50000, transactions: 100 }, // Exactly 365 days later
      ];
      
      const result = calculateNexus('WA', 100000, 200, edgeData);
      
      // Should have nexus because transactions are exactly 365 days apart (inclusive window)
      expect(result.hasNexus).toBe(true);
      expect(result.rollingBreachDate).toBe('2024-01-01');
    });
    
    it('should prioritize calendar year nexus over rolling nexus if both exist', () => {
      const mixedData: MonthlyRevenue[] = [
        // Calendar year breach
        { date: '2023-01-15', revenue: 60000, transactions: 120 },
        { date: '2023-02-15', revenue: 60000, transactions: 120 },
        
        // Rolling breach would be later
        { date: '2023-12-15', revenue: 60000, transactions: 120 },
        { date: '2024-01-15', revenue: 60000, transactions: 120 },
      ];
      
      const result = calculateNexus('WA', 240000, 480, mixedData);
      
      expect(result.hasNexus).toBe(true);
      expect(result.nexusDate).toBe('2023-02-15'); // Calendar year breach
      expect(result.rollingBreachDate).toBe('2024-01-15'); // Rolling breach also detected
    });
    
    it('should use rolling nexus if no calendar year nexus exists', () => {
      const rollingOnlyData: MonthlyRevenue[] = [
        // No calendar year breach (each year under threshold)
        { date: '2023-06-15', revenue: 40000, transactions: 80 },
        { date: '2023-12-15', revenue: 40000, transactions: 80 },
        { date: '2024-01-15', revenue: 40000, transactions: 80 },
        { date: '2024-05-15', revenue: 40000, transactions: 80 },
      ];
      
      const result = calculateNexus('WA', 160000, 320, rollingOnlyData);
      
      // No calendar year breach
      expect(result.yearlyBreaches['2023'].hasNexus).toBe(false);
      expect(result.yearlyBreaches['2024'].hasNexus).toBe(false);
      
      // But rolling breach exists
      expect(result.hasNexus).toBe(true);
      expect(result.nexusDate).toBe('2024-05-15');
      expect(result.rollingBreachDate).toBe('2024-05-15');
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
  
  describe('calculateRolling12MonthNexus', () => {
    it('should return null for empty data', () => {
      const result = calculateRolling12MonthNexus([], 100000, 200);
      expect(result.breachDate).toBeNull();
      expect(result.breachType).toBeNull();
    });
    
    it('should detect revenue breach in rolling window', () => {
      const data: MonthlyRevenue[] = [
        { date: '2023-01-15', revenue: 30000, transactions: 50 },
        { date: '2023-07-15', revenue: 30000, transactions: 50 },
        { date: '2024-01-10', revenue: 50000, transactions: 50 }, // Within 365 days of first transaction
      ];
      
      const result = calculateRolling12MonthNexus(data, 100000, 200);
      expect(result.breachDate).toBe('2024-01-10');
      expect(result.breachType).toBe('revenue');
      expect(result.windowRevenue).toBe(110000);
    });
    
    it('should detect transaction breach in rolling window', () => {
      const data: MonthlyRevenue[] = [
        { date: '2023-01-15', revenue: 10000, transactions: 50 },
        { date: '2023-07-15', revenue: 10000, transactions: 50 },
        { date: '2023-10-15', revenue: 10000, transactions: 50 },
        { date: '2024-01-10', revenue: 10000, transactions: 60 }, // Within 365 days of first transaction
      ];
      
      const result = calculateRolling12MonthNexus(data, 100000, 200);
      expect(result.breachDate).toBe('2024-01-10');
      expect(result.breachType).toBe('transactions');
      expect(result.windowTransactions).toBe(210);
    });
    
    it('should exclude transactions outside the 365-day window', () => {
      const data: MonthlyRevenue[] = [
        { date: '2023-01-01', revenue: 50000, transactions: 100 },
        { date: '2024-01-02', revenue: 60000, transactions: 120 }, // 367 days after first transaction
      ];
      
      const result = calculateRolling12MonthNexus(data, 100000, 200);
      expect(result.breachDate).toBeNull(); // No breach because first transaction falls outside window
      expect(result.windowRevenue).toBe(60000); // Only includes the second transaction
    });
    
    it('should handle transactions on consecutive days', () => {
      const data: MonthlyRevenue[] = [
        { date: '2023-01-01', revenue: 10000, transactions: 20 },
        { date: '2023-01-02', revenue: 10000, transactions: 20 },
        { date: '2023-01-03', revenue: 10000, transactions: 20 },
        { date: '2023-01-04', revenue: 10000, transactions: 20 },
        { date: '2023-01-05', revenue: 10000, transactions: 20 },
        { date: '2023-01-06', revenue: 10000, transactions: 20 },
        { date: '2023-01-07', revenue: 10000, transactions: 20 },
        { date: '2023-01-08', revenue: 10000, transactions: 20 },
        { date: '2023-01-09', revenue: 10000, transactions: 20 },
        { date: '2023-01-10', revenue: 10000, transactions: 20 },
      ];
      
      const result = calculateRolling12MonthNexus(data, 100000, 200);
      expect(result.breachDate).toBe('2023-01-10');
      expect(result.breachType).toBe('revenue');
      expect(result.windowRevenue).toBe(100000);
    });
  });
  
  describe('getDaysDifference', () => {
    it('should calculate days difference correctly', () => {
      expect(getDaysDifference(new Date('2023-01-01'), new Date('2023-01-02'))).toBe(1);
      expect(getDaysDifference(new Date('2023-01-01'), new Date('2023-02-01'))).toBe(31);
      expect(getDaysDifference(new Date('2023-01-01'), new Date('2024-01-01'))).toBe(365);
    });
    
    it('should handle leap years correctly', () => {
      expect(getDaysDifference(new Date('2024-01-01'), new Date('2025-01-01'))).toBe(366);
      expect(getDaysDifference(new Date('2024-02-29'), new Date('2025-02-28'))).toBe(365);
    });
    
    it('should handle same day', () => {
      expect(getDaysDifference(new Date('2023-01-01'), new Date('2023-01-01'))).toBe(0);
    });
  });
});