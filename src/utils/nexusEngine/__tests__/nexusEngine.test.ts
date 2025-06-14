// Nexus Engine Tests
// Unit tests for the Nexus Engine

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  TransactionRow, 
  EngineOptions,
  NexusResult,
  EngineResult
} from '../types';
import { analyzeNexus } from '../index';
import { singleYearStrategy, multiYearEstimateStrategy, cumulativeBreach } from '../strategies';
import { getCurrentRule } from '../rules';

describe('Nexus Engine', () => {
  // Sample transaction data
  const sampleTransactions: TransactionRow[] = [
    { id: '1', state_code: 'CA', amount: 30000, date: new Date('2024-01-15') },
    { id: '2', state_code: 'CA', amount: 40000, date: new Date('2024-02-20') },
    { id: '3', state_code: 'CA', amount: 50000, date: new Date('2024-03-10') },
    { id: '4', state_code: 'CA', amount: 60000, date: new Date('2024-04-05') },
    { id: '5', state_code: 'CA', amount: 70000, date: new Date('2024-05-12') },
    { id: '6', state_code: 'CA', amount: 80000, date: new Date('2024-06-18') },
    { id: '7', state_code: 'CA', amount: 90000, date: new Date('2024-07-22') },
    { id: '8', state_code: 'CA', amount: 100000, date: new Date('2024-08-30') },
    
    { id: '9', state_code: 'NY', amount: 60000, date: new Date('2024-01-10') },
    { id: '10', state_code: 'NY', amount: 70000, date: new Date('2024-02-15') },
    { id: '11', state_code: 'NY', amount: 80000, date: new Date('2024-03-20') },
    { id: '12', state_code: 'NY', amount: 90000, date: new Date('2024-04-25') },
    { id: '13', state_code: 'NY', amount: 100000, date: new Date('2024-05-30') },
    { id: '14', state_code: 'NY', amount: 110000, date: new Date('2024-06-05') },
    
    { id: '15', state_code: 'TX', amount: 10000, date: new Date('2024-01-05') },
    { id: '16', state_code: 'TX', amount: 20000, date: new Date('2024-02-10') },
    
    { id: '17', state_code: 'WA', amount: 5000, date: new Date('2024-01-01'), revenue_type: 'taxable' },
    { id: '18', state_code: 'WA', amount: 5000, date: new Date('2024-01-02'), revenue_type: 'taxable' },
    { id: '19', state_code: 'WA', amount: 5000, date: new Date('2024-01-03'), revenue_type: 'taxable' },
    { id: '20', state_code: 'WA', amount: 5000, date: new Date('2024-01-04'), revenue_type: 'taxable' },
    { id: '21', state_code: 'WA', amount: 5000, date: new Date('2024-01-05'), revenue_type: 'taxable' },
    { id: '22', state_code: 'WA', amount: 5000, date: new Date('2024-01-06'), revenue_type: 'taxable' },
    { id: '23', state_code: 'WA', amount: 5000, date: new Date('2024-01-07'), revenue_type: 'taxable' },
    { id: '24', state_code: 'WA', amount: 5000, date: new Date('2024-01-08'), revenue_type: 'taxable' },
    { id: '25', state_code: 'WA', amount: 5000, date: new Date('2024-01-09'), revenue_type: 'taxable' },
    { id: '26', state_code: 'WA', amount: 5000, date: new Date('2024-01-10'), revenue_type: 'taxable' },
    { id: '27', state_code: 'WA', amount: 5000, date: new Date('2024-01-11'), revenue_type: 'taxable' },
    { id: '28', state_code: 'WA', amount: 5000, date: new Date('2024-01-12'), revenue_type: 'taxable' },
    { id: '29', state_code: 'WA', amount: 5000, date: new Date('2024-01-13'), revenue_type: 'taxable' },
    { id: '30', state_code: 'WA', amount: 5000, date: new Date('2024-01-14'), revenue_type: 'taxable' },
    { id: '31', state_code: 'WA', amount: 5000, date: new Date('2024-01-15'), revenue_type: 'taxable' },
    { id: '32', state_code: 'WA', amount: 5000, date: new Date('2024-01-16'), revenue_type: 'taxable' },
    { id: '33', state_code: 'WA', amount: 5000, date: new Date('2024-01-17'), revenue_type: 'taxable' },
    { id: '34', state_code: 'WA', amount: 5000, date: new Date('2024-01-18'), revenue_type: 'taxable' },
    { id: '35', state_code: 'WA', amount: 5000, date: new Date('2024-01-19'), revenue_type: 'taxable' },
    { id: '36', state_code: 'WA', amount: 5000, date: new Date('2024-01-20'), revenue_type: 'taxable' },
    
    { id: '37', state_code: 'FL', amount: 10000, date: new Date('2023-01-15') },
    { id: '38', state_code: 'FL', amount: 20000, date: new Date('2023-02-20') },
    { id: '39', state_code: 'FL', amount: 30000, date: new Date('2023-03-10') },
    { id: '40', state_code: 'FL', amount: 40000, date: new Date('2023-04-05') },
    
    { id: '41', state_code: 'OR', amount: 50000, date: new Date('2024-01-15') },
    { id: '42', state_code: 'OR', amount: 60000, date: new Date('2024-02-20') },
    
    { id: '43', state_code: 'INVALID', amount: 10000, date: new Date('2024-01-15') },
    
    { id: '44', state_code: 'CA', amount: -5000, date: new Date('2024-01-20'), revenue_type: 'taxable' },
    { id: '45', state_code: 'NY', amount: 10000, date: new Date('2024-01-25'), revenue_type: 'marketplace' }
  ];
  
  describe('analyzeNexus', () => {
    it('should analyze transactions in singleYear mode', async () => {
      const options: EngineOptions = {
        mode: 'singleYear',
        analysisYear: 2024
      };
      
      const result = await analyzeNexus(sampleTransactions, options);
      
      expect(result).toBeDefined();
      expect(result.nexusResults).toBeInstanceOf(Array);
      expect(result.stateStats).toBeInstanceOf(Array);
      expect(result.warnings).toBeInstanceOf(Array);
      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.rowsProcessed).toBe(sampleTransactions.length - 1); // Minus the invalid state
      
      // Check CA result (should exceed threshold)
      const caResult = result.nexusResults.find(r => r.state_code === 'CA');
      expect(caResult).toBeDefined();
      expect(caResult?.exceeded).toBe(true);
      expect(caResult?.total_revenue).toBe(520000); // Sum of all CA transactions
      
      // Check TX result (should not exceed threshold)
      const txResult = result.nexusResults.find(r => r.state_code === 'TX');
      expect(txResult).toBeDefined();
      expect(txResult?.exceeded).toBe(false);
      expect(txResult?.total_revenue).toBe(30000); // Sum of all TX transactions
      
      // Check WA result (should exceed transaction threshold)
      const waResult = result.nexusResults.find(r => r.state_code === 'WA');
      expect(waResult).toBeDefined();
      expect(waResult?.exceeded).toBe(true);
      expect(waResult?.breach_type).toBe('transactions');
      
      // Check OR result (should not have nexus as it's a no-sales-tax state)
      const orResult = result.nexusResults.find(r => r.state_code === 'OR');
      expect(orResult).toBeDefined();
      expect(orResult?.exceeded).toBe(false);
      expect(orResult?.threshold_revenue).toBe(0);
    });
    
    it('should analyze transactions in multiYearEstimate mode', async () => {
      const options: EngineOptions = {
        mode: 'multiYearEstimate',
        yearRange: [2023, 2024]
      };
      
      const result = await analyzeNexus(sampleTransactions, options);
      
      expect(result).toBeDefined();
      expect(result.nexusResults).toBeInstanceOf(Array);
      
      // Check FL result (should include 2023 data)
      const flResult = result.nexusResults.find(r => r.state_code === 'FL');
      expect(flResult).toBeDefined();
      expect(flResult?.total_revenue).toBe(100000); // Sum of all FL transactions
      expect(flResult?.threshold_percentage).toBe(100); // Exactly at threshold
    });
    
    it('should filter out marketplace transactions when ignoreMarketplace is true', async () => {
      const options: EngineOptions = {
        mode: 'singleYear',
        analysisYear: 2024,
        ignoreMarketplace: true
      };
      
      const result = await analyzeNexus(sampleTransactions, options);
      
      // Check NY result (should not include marketplace transaction)
      const nyResult = result.nexusResults.find(r => r.state_code === 'NY');
      expect(nyResult).toBeDefined();
      expect(nyResult?.total_revenue).toBe(500000); // Sum of all NY transactions except marketplace
    });
    
    it('should filter out negative amounts when includeNegativeAmounts is false', async () => {
      const options: EngineOptions = {
        mode: 'singleYear',
        analysisYear: 2024,
        includeNegativeAmounts: false
      };
      
      const result = await analyzeNexus(sampleTransactions, options);
      
      // Check CA result (should not include negative transaction)
      const caResult = result.nexusResults.find(r => r.state_code === 'CA');
      expect(caResult).toBeDefined();
      expect(caResult?.total_revenue).toBe(520000); // Sum of all CA transactions except negative
    });
    
    it('should include negative amounts when includeNegativeAmounts is true', async () => {
      const options: EngineOptions = {
        mode: 'singleYear',
        analysisYear: 2024,
        includeNegativeAmounts: true
      };
      
      const result = await analyzeNexus(sampleTransactions, options);
      
      // Check CA result (should include negative transaction)
      const caResult = result.nexusResults.find(r => r.state_code === 'CA');
      expect(caResult).toBeDefined();
      expect(caResult?.total_revenue).toBe(515000); // Sum of all CA transactions including negative
    });
    
    it('should filter out invalid state codes', async () => {
      const options: EngineOptions = {
        mode: 'singleYear',
        analysisYear: 2024
      };
      
      const result = await analyzeNexus(sampleTransactions, options);
      
      // Check warnings
      expect(result.warnings.some(w => w.includes('invalid state codes'))).toBe(true);
      
      // Check that INVALID state is not in results
      const invalidResult = result.nexusResults.find(r => r.state_code === 'INVALID');
      expect(invalidResult).toBeUndefined();
    });
  });
  
  describe('singleYearStrategy', () => {
    it('should correctly identify nexus breach', () => {
      const caRule = getCurrentRule('CA')!;
      const caTransactions = sampleTransactions.filter(t => t.state_code === 'CA');
      
      const result = singleYearStrategy(caTransactions, caRule, 2024);
      
      expect(result.exceeded).toBe(true);
      expect(result.first_breach_date).toBeDefined();
      expect(result.breach_type).toBe('revenue');
    });
    
    it('should correctly identify no nexus', () => {
      const txRule = getCurrentRule('TX')!;
      const txTransactions = sampleTransactions.filter(t => t.state_code === 'TX');
      
      const result = singleYearStrategy(txTransactions, txRule, 2024);
      
      expect(result.exceeded).toBe(false);
      expect(result.first_breach_date).toBeUndefined();
      expect(result.breach_type).toBeNull();
    });
    
    it('should correctly calculate threshold percentage', () => {
      const txRule = getCurrentRule('TX')!;
      const txTransactions = sampleTransactions.filter(t => t.state_code === 'TX');
      
      const result = singleYearStrategy(txTransactions, txRule, 2024);
      
      expect(result.threshold_percentage).toBe(6); // $30,000 / $500,000 = 6%
    });
  });
  
  describe('multiYearEstimateStrategy', () => {
    it('should find nexus in the earliest year it occurred', () => {
      const flRule = getCurrentRule('FL')!;
      const flTransactions = sampleTransactions.filter(t => t.state_code === 'FL');
      
      const result = multiYearEstimateStrategy(flTransactions, flRule, [2023, 2024]);
      
      expect(result.exceeded).toBe(true);
      expect(result.period_qualified).toBe('2023');
    });
    
    it('should return false for no nexus across years', () => {
      const txRule = getCurrentRule('TX')!;
      const txTransactions = sampleTransactions.filter(t => t.state_code === 'TX');
      
      const result = multiYearEstimateStrategy(txTransactions, txRule, [2023, 2024]);
      
      expect(result.exceeded).toBe(false);
    });
  });
  
  describe('cumulativeBreach', () => {
    it('should detect revenue breach', () => {
      const caRule = getCurrentRule('CA')!;
      const caTransactions = sampleTransactions
        .filter(t => t.state_code === 'CA')
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const result = cumulativeBreach(caTransactions, caRule);
      
      expect(result.breachIdx).toBeGreaterThan(-1);
      expect(result.breachType).toBe('revenue');
      expect(result.sum).toBeGreaterThanOrEqual(caRule.amount);
    });
    
    it('should detect transaction count breach', () => {
      const waRule = getCurrentRule('WA')!;
      const waTransactions = sampleTransactions
        .filter(t => t.state_code === 'WA')
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const result = cumulativeBreach(waTransactions, waRule);
      
      expect(result.breachIdx).toBeGreaterThan(-1);
      expect(result.breachType).toBe('transactions');
      expect(result.cnt).toBeGreaterThanOrEqual(waRule.txn!);
    });
    
    it('should return -1 for no breach', () => {
      const txRule = getCurrentRule('TX')!;
      const txTransactions = sampleTransactions
        .filter(t => t.state_code === 'TX')
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const result = cumulativeBreach(txTransactions, txRule);
      
      expect(result.breachIdx).toBe(-1);
      expect(result.breachType).toBeNull();
    });
    
    it('should handle no-sales-tax states', () => {
      const orRule = getCurrentRule('OR')!;
      const orTransactions = sampleTransactions
        .filter(t => t.state_code === 'OR')
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      
      const result = cumulativeBreach(orTransactions, orRule);
      
      expect(result.breachIdx).toBe(-1);
      expect(result.breachType).toBeNull();
    });
  });
});