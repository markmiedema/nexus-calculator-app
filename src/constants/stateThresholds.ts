// State nexus thresholds based on post-Wayfair economic nexus rules
// These are simplified for the MVP and would need to be updated regularly in a production app

interface StateThreshold {
  revenue: number;
  transactions: number | null; // null indicates no transaction threshold
}

// Default thresholds
const DEFAULT_THRESHOLD: StateThreshold = {
  revenue: 100000,
  transactions: 200
};

// States with no sales tax
const NO_SALES_TAX_STATES = ['MT', 'NH', 'OR', 'DE', 'AK'];

// State-specific thresholds
const SPECIAL_THRESHOLDS: Record<string, StateThreshold> = {
  // States with revenue-only thresholds
  'AL': { revenue: 250000, transactions: null },
  'AK': { revenue: 100000, transactions: null },
  'AZ': { revenue: 100000, transactions: null },
  'CA': { revenue: 500000, transactions: null },
  'CO': { revenue: 100000, transactions: null },
  'FL': { revenue: 100000, transactions: null },
  'HI': { revenue: 100000, transactions: null },
  'ID': { revenue: 100000, transactions: null },
  'KS': { revenue: 100000, transactions: null },
  'KY': { revenue: 100000, transactions: null },
  'LA': { revenue: 100000, transactions: null },
  'ME': { revenue: 100000, transactions: null },
  'MD': { revenue: 100000, transactions: null },
  'MN': { revenue: 100000, transactions: null },
  'MS': { revenue: 250000, transactions: null },
  'NE': { revenue: 100000, transactions: null },
  'NV': { revenue: 100000, transactions: null },
  'NJ': { revenue: 100000, transactions: null },
  'NM': { revenue: 100000, transactions: null },
  'NY': { revenue: 500000, transactions: null },
  'NC': { revenue: 100000, transactions: null },
  'ND': { revenue: 100000, transactions: null },
  'OH': { revenue: 100000, transactions: null },
  'OK': { revenue: 100000, transactions: null },
  'PA': { revenue: 100000, transactions: null },
  'RI': { revenue: 100000, transactions: null },
  'SC': { revenue: 100000, transactions: null },
  'SD': { revenue: 100000, transactions: null },
  'TN': { revenue: 100000, transactions: null },
  'TX': { revenue: 500000, transactions: null },
  'UT': { revenue: 100000, transactions: null },
  'VT': { revenue: 100000, transactions: null },
  'VA': { revenue: 100000, transactions: null },
  'WV': { revenue: 100000, transactions: null },
  'WY': { revenue: 100000, transactions: null },
  'DC': { revenue: 100000, transactions: null },
  
  // States with both revenue and transaction thresholds
  'AR': { revenue: 100000, transactions: 200 },
  'CT': { revenue: 100000, transactions: 200 },
  'GA': { revenue: 100000, transactions: 200 },
  'IL': { revenue: 100000, transactions: 200 },
  'IN': { revenue: 100000, transactions: 200 },
  'IA': { revenue: 100000, transactions: 200 },
  'MA': { revenue: 100000, transactions: 200 },
  'MI': { revenue: 100000, transactions: 200 },
  'MO': { revenue: 100000, transactions: 200 },
  'WA': { revenue: 100000, transactions: 200 },
  'WI': { revenue: 100000, transactions: 200 }
};

export const determineStateThresholds = (stateCode: string): StateThreshold => {
  // Check if state has no sales tax
  if (NO_SALES_TAX_STATES.includes(stateCode)) {
    return { revenue: 0, transactions: null };
  }
  
  // Check if state has special thresholds
  if (stateCode in SPECIAL_THRESHOLDS) {
    return SPECIAL_THRESHOLDS[stateCode];
  }
  
  // Otherwise, return default thresholds
  return DEFAULT_THRESHOLD;
};

export const getAllStateThresholds = (): Record<string, StateThreshold> => {
  const thresholds: Record<string, StateThreshold> = {};
  
  // US state codes
  const stateCodes = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'DC'
  ];
  
  // Populate thresholds for all states
  for (const code of stateCodes) {
    thresholds[code] = determineStateThresholds(code);
  }
  
  return thresholds;
};