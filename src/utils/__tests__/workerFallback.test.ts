import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processCSVDataFallback, runNexusEngineInMainThread } from '../workerFallback';
import { analyzeNexus } from '../nexusEngine';

// Mock the nexusEngine module
vi.mock('../nexusEngine', () => ({
  analyzeNexus: vi.fn().mockResolvedValue({
    nexusResults: [{ state_code: 'CA', exceeded: true }],
    stateStats: [],
    warnings: [],
    processingTime: 100,
    rowsProcessed: 32
  })
}));

// Mock the csvProcessor module
vi.mock('../csvProcessor', () => ({
  processCSVData: vi.fn().mockResolvedValue({
    nexusStates: [],
    totalLiability: 0,
    priorityStates: [],
    salesByState: [
      {
        code: 'CA',
        name: 'California',
        totalRevenue: 100000,
        transactionCount: 10,
        monthlyRevenue: [
          { date: '2024-01-01', revenue: 100000, transactions: 10 }
        ],
        revenueThreshold: 500000,
        transactionThreshold: null,
        thresholdProximity: 20,
        taxRate: 8.68,
        annualData: {}
      }
    ],
    dataRange: {
      start: '2024-01-01',
      end: '2024-01-31'
    },
    availableYears: ['2024']
  })
}));

describe('workerFallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('processCSVDataFallback', () => {
    it('should process data and return results', async () => {
      const mockData = [
        { date: '2024-01-01', state: 'CA', sale_amount: '1000' }
      ];
      
      const progressCallback = vi.fn();
      
      const result = await processCSVDataFallback(mockData, progressCallback);
      
      expect(result).toBeDefined();
      expect(result.salesByState.length).toBeGreaterThan(0);
      expect(progressCallback).toHaveBeenCalled();
    });
  });

  describe('runNexusEngineInMainThread', () => {
    it('should map data and call analyzeNexus', async () => {
      const mockData = [
        { id: '1', date: '2024-01-01', state: 'CA', sale_amount: '1000' },
        { id: '2', date: '2024-01-02', state: 'NY', sale_amount: '2000' }
      ];
      
      const progressCallback = vi.fn();
      
      const result = await runNexusEngineInMainThread(mockData, progressCallback);
      
      expect(result).toBeDefined();
      expect(analyzeNexus).toHaveBeenCalled();
      
      // Verify the data was mapped correctly
      const callArgs = (analyzeNexus as any).mock.calls[0][0];
      expect(callArgs.length).toBe(2);
      expect(callArgs[0].state_code).toBe('CA');
      expect(callArgs[0].amount).toBe(1000);
      expect(callArgs[0].date).toBeInstanceOf(Date);
      
      // Verify progress callback was called
      expect(progressCallback).toHaveBeenCalledWith(30);
      expect(progressCallback).toHaveBeenCalledWith(100);
    });
    
    it('should handle empty data', async () => {
      const result = await runNexusEngineInMainThread([]);
      
      expect(result).toBeDefined();
      expect(analyzeNexus).toHaveBeenCalledWith([], expect.anything());
    });
    
    it('should handle errors', async () => {
      (analyzeNexus as any).mockRejectedValueOnce(new Error('Test error'));
      
      await expect(runNexusEngineInMainThread([{ date: '2024-01-01', state: 'CA', sale_amount: '1000' }]))
        .rejects.toThrow('Main thread Nexus Engine processing failed: Test error');
    });
    
    it('should return a Promise that resolves with results', async () => {
      const mockData = Array.from({ length: 32 }, (_, i) => ({
        id: `tx-${i}`,
        date: '2024-01-01',
        state: 'CA',
        sale_amount: '1000'
      }));
      
      const result = await runNexusEngineInMainThread(mockData);
      
      expect(result.nexusResults.length).toBeGreaterThanOrEqual(1);
    });
  });
});