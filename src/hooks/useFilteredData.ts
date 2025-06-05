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

      // Recalculate threshold proximity
      const thresholds = determineStateThresholds(state.code);
      const revenueProximity = thresholds.revenue > 0
        ? Number(((totalRevenue / thresholds.revenue) * 100).toFixed(2))
        : 0;
      const transactionProximity = thresholds.transactions
        ? Number(((transactionCount / thresholds.transactions) * 100).toFixed(2))
        : 0;
      const thresholdProximity = Math.max(revenueProximity, transactionProximity);

      return {
        ...state,
        totalRevenue,
        transactionCount,
        thresholdProximity,
        monthlyRevenue: filteredMonthlyRevenue
      };
    });

    // Recalculate nexus states based on filtered data
    const nexusStates: NexusState[] = [];

    filteredSalesByState.forEach(state => {
      if (state.thresholdProximity >= 100) {
        // Find when nexus was first established within selected years
        let runningRevenue = 0;
        let runningTransactions = 0;
        let nexusDate = '';

        for (const month of state.monthlyRevenue) {
          runningRevenue += month.revenue;
          runningTransactions += month.transactions;

          if (runningRevenue >= state.revenueThreshold ||
              (state.transactionThreshold && runningTransactions >= state.transactionThreshold)) {
            nexusDate = month.date;
            break;
          }
        }

        if (nexusDate) {
          const { liability, taxRate } = calculateTaxLiability(
            state.code,
            state.totalRevenue,
            nexusDate,
            state.monthlyRevenue
          );

          nexusStates.push({
            code: state.code,
            name: state.name,
            totalRevenue: state.totalRevenue,
            transactionCount: state.transactionCount,
            monthlyRevenue: state.monthlyRevenue,
            nexusDate,
            thresholdTriggered: runningRevenue >= state.revenueThreshold ? 'revenue' : 'transactions',
            revenueThreshold: state.revenueThreshold,
            transactionThreshold: state.transactionThreshold,
            registrationDeadline: calculateRegistrationDeadline(nexusDate),
            filingFrequency: determineFilingFrequency(state.totalRevenue),
            taxRate,
            liability,
            preNexusRevenue: 0,
            postNexusRevenue: state.totalRevenue,
            effectiveDate: nexusDate,
            annualData: {}
          });
        }
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