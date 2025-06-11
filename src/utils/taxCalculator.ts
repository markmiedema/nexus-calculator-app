import { MonthlyRevenue } from '../types';
import { getStateTaxRate } from '../constants/taxRates';
import { isWithinNexusPeriod } from './nexusCalculator';

interface TaxLiabilityResult {
  liability: number;
  taxRate: number;
  preNexusRevenue: number;
  postNexusRevenue: number;
  effectiveDate: string;
}

export const calculateTaxLiability = (
  stateCode: string,
  totalRevenue: number,
  nexusDate: string,
  monthlyData: MonthlyRevenue[]
): TaxLiabilityResult => {
  // Get the tax rate for this state
  const taxRate = getStateTaxRate(stateCode);
  
  // If no nexus or zero tax rate, return zero liability
  if (!nexusDate || taxRate === 0) {
    return {
      liability: 0,
      taxRate,
      preNexusRevenue: totalRevenue,
      postNexusRevenue: 0,
      effectiveDate: ''
    };
  }
  
  let preNexusRevenue = 0;
  let postNexusRevenue = 0;
  let effectiveDate = '';
  
  // Sort data chronologically
  const sortedData = [...monthlyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate pre and post nexus revenue
  for (const month of sortedData) {
    const monthDate = new Date(month.date);
    const nexusDateObj = new Date(nexusDate);
    
    if (monthDate < nexusDateObj) {
      preNexusRevenue += month.revenue;
    } else if (monthDate.getTime() === nexusDateObj.getTime()) {
      // For the nexus month, we need to handle partial taxation
      const nexusThreshold = determineNexusThreshold(stateCode);
      const amountOverThreshold = month.revenue - (nexusThreshold - preNexusRevenue);
      if (amountOverThreshold > 0) {
        postNexusRevenue += amountOverThreshold;
        preNexusRevenue += month.revenue - amountOverThreshold;
      } else {
        preNexusRevenue += month.revenue;
      }
      effectiveDate = nexusDate;
    } else {
      postNexusRevenue += month.revenue;
    }
  }
  
  // Calculate liability only on post-nexus revenue
  const liability = Math.round(postNexusRevenue * (taxRate / 100));
  
  return {
    liability,
    taxRate,
    preNexusRevenue,
    postNexusRevenue,
    effectiveDate
  };
};

const determineNexusThreshold = (stateCode: string): number => {
  // This would normally come from a configuration file or database
  // For now, using standard threshold
  return 100000;
};

export const estimatePenalties = (
  stateCode: string,
  liability: number,
  nexusDate: string,
  registrationDate?: string
): number => {
  if (!registrationDate) {
    registrationDate = new Date().toISOString();
  }
  
  const nexusDateObj = new Date(nexusDate);
  const registrationDateObj = new Date(registrationDate);
  const gracePeriod = 30; // 30 days grace period
  
  // Calculate months late (excluding grace period)
  const monthsLate = Math.max(0, Math.floor(
    (registrationDateObj.getTime() - nexusDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30) - (gracePeriod / 30)
  ));
  
  if (monthsLate <= 0) return 0;
  
  // Penalty calculation (5% per month up to 25%)
  const penaltyRate = Math.min(0.25, monthsLate * 0.05);
  return Math.round(liability * penaltyRate);
};