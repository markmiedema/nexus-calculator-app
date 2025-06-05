// Approximate combined state and local sales tax rates
// These are simplified for the MVP and would need to be updated regularly in a production app

// Average tax rates by state (combined state + estimated average local rates)
const STATE_TAX_RATES: Record<string, number> = {
  'AL': 9.22,
  'AK': 1.76,
  'AZ': 8.40,
  'AR': 9.47,
  'CA': 8.68,
  'CO': 7.72,
  'CT': 6.35,
  'DE': 0.00,
  'FL': 7.08,
  'GA': 7.35,
  'HI': 4.44,
  'ID': 6.03,
  'IL': 9.08,
  'IN': 7.00,
  'IA': 6.94,
  'KS': 8.69,
  'KY': 6.00,
  'LA': 9.52,
  'ME': 5.50,
  'MD': 6.00,
  'MA': 6.25,
  'MI': 6.00,
  'MN': 7.46,
  'MS': 7.07,
  'MO': 8.18,
  'MT': 0.00,
  'NE': 6.94,
  'NV': 8.23,
  'NH': 0.00,
  'NJ': 6.60,
  'NM': 7.83,
  'NY': 8.52,
  'NC': 6.98,
  'ND': 6.86,
  'OH': 7.23,
  'OK': 8.95,
  'OR': 0.00,
  'PA': 6.34,
  'RI': 7.00,
  'SC': 7.46,
  'SD': 6.40,
  'TN': 9.55,
  'TX': 8.19,
  'UT': 7.19,
  'VT': 6.24,
  'VA': 5.73,
  'WA': 9.23,
  'WV': 6.41,
  'WI': 5.43,
  'WY': 5.33,
  'DC': 6.00
};

export const getStateTaxRate = (stateCode: string): number => {
  return STATE_TAX_RATES[stateCode] || 0;
};

export const getAllStateTaxRates = (): Record<string, number> => {
  return { ...STATE_TAX_RATES };
};