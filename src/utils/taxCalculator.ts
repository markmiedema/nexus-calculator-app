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
  let effectiveDate = nexusDate;
  
  // Sort data chronologically
  const sortedData = [...monthlyData].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate pre and post nexus revenue
  for (const month of sortedData) {
    const isAfterNexus = isWithinNexusPeriod(month.date, nexusDate);
    
    if (isAfterNexus) {
      postNexusRevenue += month.revenue;
    } else {
      preNexusRevenue += month.revenue;
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