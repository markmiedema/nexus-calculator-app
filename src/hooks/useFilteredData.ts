import { useMemo } from 'react';
import { useYearSelection } from '../context/YearSelectionContext';
import { ProcessedData, NexusState, SalesByState } from '../types';
import { determineStateThresholds } from '../constants/stateThresholds';
import { calculateTaxLiability } from '../utils/taxCalculator';
import { APP_CONFIG } from '../config';

export const useFilteredData = (originalData: ProcessedData): ProcessedData => {
  const { selectedYears } = useYearSelection();

  return useMemo(() => {
    if (selectedYears.length === 0) {
      return {
        ...originalData,
        nexusStates: [],
        totalLiability: 0,
        priorityStates: [],
        salesByState: originalData.salesByState.map(state => ({
          ...state,
          totalRevenue: 0,
          transactionCount: 0,
          thresholdProximity: 0,
          monthlyRevenue: []
        }))
      };
    }

    // Filter and recalculate everything based on selected years
    const filteredSalesByState = originalData.salesByState.map(state => {
      // Filter monthly revenue by selected years
      const filteredMonthlyRevenue = state.monthlyRevenue.filter(
        month => selectedYears.includes(month.date.substring(0, 4))
      );

      // Recalculate totals for selected years only
      const totalRevenue = filteredMonthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);
      const transactionCount = filteredMonthlyRevenue.reduce((sum, month) => sum + month.transactions, 0);

      // Get annual data for selected years
      const filteredAnnualData: Record<string, any> = {};
      for (const year of selectedYears) {
        if (state.annualData && state.annualData[year]) {
          filteredAnnualData[year] = state.annualData[year];
        }
      }

      // Recalculate threshold proximity based on CURRENT YEAR ONLY or most recent selected year
      const thresholds = determineStateThresholds(state.code);
      let thresholdProximity = 0;
      
      // Find the most recent selected year that has data
      const sortedYears = [...selectedYears].sort().reverse();
      for (const year of sortedYears) {
        if (filteredAnnualData[year]) {
          const yearData = filteredAnnualData[year];
          const revenueProximity = thresholds.revenue > 0
            ? Number(((yearData.totalRevenue / thresholds.revenue) * 100).toFixed(2))
            : 0;
          const transactionProximity = thresholds.transactions
            ? Number(((yearData.transactionCount / thresholds.transactions) * 100).toFixed(2))
            : 0;
          thresholdProximity = Math.max(revenueProximity, transactionProximity);
          break;
        }
      }

      return {
        ...state,
        totalRevenue,
        transactionCount,
        thresholdProximity,
        monthlyRevenue: filteredMonthlyRevenue,
        annualData: filteredAnnualData
      };
    });

    // Recalculate nexus states based on filtered data
    // We need to check each year independently
    const nexusStates: NexusState[] = [];

    filteredSalesByState.forEach(state => {
      // Check each selected year independently for nexus
      let earliestNexusDate: string | null = null;
      let nexusTriggeredBy: 'revenue' | 'transactions' = 'revenue';
      let postNexusRevenue = 0;
      
      for (const year of selectedYears) {
        const yearData = state.annualData[year];
        if (!yearData) continue;
        
        const thresholds = determineStateThresholds(state.code);
        
        // Check if this year alone meets the threshold
        const hasRevenueNexus = yearData.totalRevenue >= thresholds.revenue;
        const hasTransactionNexus = thresholds.transactions !== null && 
          yearData.transactionCount >= thresholds.transactions;
        
        if (hasRevenueNexus || hasTransactionNexus) {
          // Find the first transaction date in this year
          const yearMonthlyData = state.monthlyRevenue.filter(m => m.date.startsWith(year));
          if (yearMonthlyData.length === 0) continue;
          
          const firstDateInYear = yearMonthlyData
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date;
          
          if (!earliestNexusDate || firstDateInYear < earliestNexusDate) {
            earliestNexusDate = firstDateInYear;
            nexusTriggeredBy = hasRevenueNexus ? 'revenue' : 'transactions';
          }
        }
      }
      
      if (earliestNexusDate) {
        // Calculate post-nexus revenue
        for (const year of selectedYears) {
          const yearData = state.annualData[year];
          if (!yearData) continue;
          
          const yearStart = `${year}-01-01`;
          if (yearStart >= earliestNexusDate) {
            // If the whole year is after nexus date, add all revenue
            postNexusRevenue += yearData.totalRevenue;
          } else {
            // If nexus was established during this year, calculate partial year revenue
            const nexusDateObj = new Date(earliestNexusDate);
            const yearMonthlyData = state.monthlyRevenue.filter(m => 
              m.date.startsWith(year) && new Date(m.date) >= nexusDateObj
            );
            const partialYearRevenue = yearMonthlyData.reduce((sum, m) => sum + m.revenue, 0);
            postNexusRevenue += partialYearRevenue;
          }
        }
        
        const { liability, taxRate } = calculateTaxLiability(
          state.code,
          postNexusRevenue,
          earliestNexusDate,
          state.monthlyRevenue.filter(m => selectedYears.includes(m.date.substring(0, 4)))
        );

        nexusStates.push({
          code: state.code,
          name: state.name,
          totalRevenue: state.totalRevenue,
          transactionCount: state.transactionCount,
          monthlyRevenue: state.monthlyRevenue,
          nexusDate: earliestNexusDate,
          thresholdTriggered: nexusTriggeredBy,
          revenueThreshold: state.revenueThreshold,
          transactionThreshold: state.transactionThreshold,
          registrationDeadline: calculateRegistrationDeadline(earliestNexusDate),
          filingFrequency: determineFilingFrequency(postNexusRevenue),
          taxRate,
          liability,
          preNexusRevenue: state.totalRevenue - postNexusRevenue,
          postNexusRevenue,
          effectiveDate: earliestNexusDate,
          annualData: state.annualData
        });
      }
    });

    // Sort by liability and get priority states
    const priorityStates = [...nexusStates]
      .sort((a, b) => b.liability - a.liability)
      .slice(0, APP_CONFIG.maxPriorityStates);

    const totalLiability = nexusStates.reduce((sum, state) => sum + state.liability, 0);

    // Calculate date range for selected years only
    const selectedDates = originalData.salesByState
      .flatMap(state => state.monthlyRevenue)
      .filter(month => selectedYears.includes(month.date.substring(0, 4)))
      .map(month => month.date);

    const dataRange = selectedDates.length > 0 ? {
      start: selectedDates.reduce((min, date) => date < min ? date : min),
      end: selectedDates.reduce((max, date) => date > max ? date : max)
    } : originalData.dataRange;

    return {
      ...originalData,
      nexusStates,
      totalLiability,
      priorityStates,
      salesByState: filteredSalesByState,
      dataRange
    };
  }, [originalData, selectedYears]);
};

const calculateRegistrationDeadline = (nexusDate: string): string => {
  const date = new Date(nexusDate);
  date.setDate(date.getDate() + APP_CONFIG.gracePeriodDays);
  return date.toISOString().split('T')[0];
};

const determineFilingFrequency = (revenue: number): string => {
  if (revenue > APP_CONFIG.defaultFilingThresholds.monthly) return 'Monthly';
  if (revenue > APP_CONFIG.defaultFilingThresholds.quarterly) return 'Quarterly';
  return 'Annually';
};