// Nexus Engine Rules
// Manages nexus threshold rules for all states

import { NexusRule } from './types';

/**
 * Latest nexus thresholds for all states (as of 2025)
 * This is bundled with the app for offline-speed lookups
 */
export const CURRENT_NEXUS_RULES: NexusRule[] = [
  // States with revenue-only thresholds
  { state_code: 'AL', amount: 250000, txn: null, effective_date: new Date('2019-01-01'), rule_id: 'AL-2019-01' },
  { state_code: 'AK', amount: 100000, txn: null, effective_date: new Date('2020-01-01'), rule_id: 'AK-2020-01' },
  { state_code: 'AZ', amount: 100000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'AZ-2019-01' },
  { state_code: 'CA', amount: 500000, txn: null, effective_date: new Date('2019-04-01'), rule_id: 'CA-2019-01' },
  { state_code: 'CO', amount: 100000, txn: null, effective_date: new Date('2019-06-01'), rule_id: 'CO-2019-01' },
  { state_code: 'FL', amount: 100000, txn: null, effective_date: new Date('2021-07-01'), rule_id: 'FL-2021-01' },
  { state_code: 'HI', amount: 100000, txn: null, effective_date: new Date('2018-07-01'), rule_id: 'HI-2018-01' },
  { state_code: 'ID', amount: 100000, txn: null, effective_date: new Date('2019-06-01'), rule_id: 'ID-2019-01' },
  { state_code: 'KS', amount: 100000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'KS-2019-01' },
  { state_code: 'KY', amount: 100000, txn: null, effective_date: new Date('2019-07-01'), rule_id: 'KY-2019-01' },
  { state_code: 'LA', amount: 100000, txn: null, effective_date: new Date('2020-07-01'), rule_id: 'LA-2020-01' },
  { state_code: 'ME', amount: 100000, txn: null, effective_date: new Date('2019-07-01'), rule_id: 'ME-2019-01' },
  { state_code: 'MD', amount: 100000, txn: null, effective_date: new Date('2018-10-01'), rule_id: 'MD-2018-01' },
  { state_code: 'MN', amount: 100000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'MN-2019-01' },
  { state_code: 'MS', amount: 250000, txn: null, effective_date: new Date('2018-09-01'), rule_id: 'MS-2018-01' },
  { state_code: 'NE', amount: 100000, txn: null, effective_date: new Date('2019-04-01'), rule_id: 'NE-2019-01' },
  { state_code: 'NV', amount: 100000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'NV-2019-01' },
  { state_code: 'NJ', amount: 100000, txn: null, effective_date: new Date('2019-11-01'), rule_id: 'NJ-2019-01' },
  { state_code: 'NM', amount: 100000, txn: null, effective_date: new Date('2019-07-01'), rule_id: 'NM-2019-01' },
  { state_code: 'NY', amount: 500000, txn: null, effective_date: new Date('2019-06-01'), rule_id: 'NY-2019-01' },
  { state_code: 'NC', amount: 100000, txn: null, effective_date: new Date('2019-11-01'), rule_id: 'NC-2019-01' },
  { state_code: 'ND', amount: 100000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'ND-2019-01' },
  { state_code: 'OH', amount: 100000, txn: null, effective_date: new Date('2019-08-01'), rule_id: 'OH-2019-01' },
  { state_code: 'OK', amount: 100000, txn: null, effective_date: new Date('2019-11-01'), rule_id: 'OK-2019-01' },
  { state_code: 'PA', amount: 100000, txn: null, effective_date: new Date('2019-07-01'), rule_id: 'PA-2019-01' },
  { state_code: 'RI', amount: 100000, txn: null, effective_date: new Date('2019-07-01'), rule_id: 'RI-2019-01' },
  { state_code: 'SC', amount: 100000, txn: null, effective_date: new Date('2019-11-01'), rule_id: 'SC-2019-01' },
  { state_code: 'SD', amount: 100000, txn: null, effective_date: new Date('2018-11-01'), rule_id: 'SD-2018-01' },
  { state_code: 'TN', amount: 100000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'TN-2019-01' },
  { state_code: 'TX', amount: 500000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'TX-2019-01' },
  { state_code: 'UT', amount: 100000, txn: null, effective_date: new Date('2019-10-01'), rule_id: 'UT-2019-01' },
  { state_code: 'VT', amount: 100000, txn: null, effective_date: new Date('2018-07-01'), rule_id: 'VT-2018-01' },
  { state_code: 'VA', amount: 100000, txn: null, effective_date: new Date('2019-07-01'), rule_id: 'VA-2019-01' },
  { state_code: 'WV', amount: 100000, txn: null, effective_date: new Date('2019-01-01'), rule_id: 'WV-2019-01' },
  { state_code: 'WY', amount: 100000, txn: null, effective_date: new Date('2019-07-01'), rule_id: 'WY-2019-01' },
  { state_code: 'DC', amount: 100000, txn: null, effective_date: new Date('2019-01-01'), rule_id: 'DC-2019-01' },
  
  // States with both revenue and transaction thresholds
  { state_code: 'AR', amount: 100000, txn: 200, effective_date: new Date('2019-07-01'), rule_id: 'AR-2019-01' },
  { state_code: 'CT', amount: 100000, txn: 200, effective_date: new Date('2019-07-01'), rule_id: 'CT-2019-01' },
  { state_code: 'GA', amount: 100000, txn: 200, effective_date: new Date('2019-01-01'), rule_id: 'GA-2019-01' },
  { state_code: 'IL', amount: 100000, txn: 200, effective_date: new Date('2020-01-01'), rule_id: 'IL-2020-01' },
  { state_code: 'IN', amount: 100000, txn: 200, effective_date: new Date('2019-07-01'), rule_id: 'IN-2019-01' },
  { state_code: 'IA', amount: 100000, txn: 200, effective_date: new Date('2019-01-01'), rule_id: 'IA-2019-01' },
  { state_code: 'MA', amount: 100000, txn: 200, effective_date: new Date('2019-10-01'), rule_id: 'MA-2019-01' },
  { state_code: 'MI', amount: 100000, txn: 200, effective_date: new Date('2019-10-01'), rule_id: 'MI-2019-01' },
  { state_code: 'MO', amount: 100000, txn: 200, effective_date: new Date('2023-01-01'), rule_id: 'MO-2023-01' },
  { state_code: 'WA', amount: 100000, txn: 200, effective_date: new Date('2019-03-01'), rule_id: 'WA-2019-01' },
  { state_code: 'WI', amount: 100000, txn: 200, effective_date: new Date('2019-10-01'), rule_id: 'WI-2019-01' },
  
  // States with no sales tax
  { state_code: 'MT', amount: 0, txn: null, effective_date: new Date('2018-06-21'), rule_id: 'MT-2018-01' },
  { state_code: 'NH', amount: 0, txn: null, effective_date: new Date('2018-06-21'), rule_id: 'NH-2018-01' },
  { state_code: 'OR', amount: 0, txn: null, effective_date: new Date('2018-06-21'), rule_id: 'OR-2018-01' },
  { state_code: 'DE', amount: 0, txn: null, effective_date: new Date('2018-06-21'), rule_id: 'DE-2018-01' },
  { state_code: 'AK', amount: 0, txn: null, effective_date: new Date('2018-06-21'), rule_id: 'AK-2018-01' }
];

/**
 * Valid US state codes for validation
 */
export const VALID_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

/**
 * Get the current nexus rule for a specific state
 */
export function getCurrentRule(stateCode: string): NexusRule | null {
  return CURRENT_NEXUS_RULES.find(rule => rule.state_code === stateCode) || null;
}

/**
 * Get all current nexus rules
 */
export function getAllCurrentRules(): NexusRule[] {
  return [...CURRENT_NEXUS_RULES];
}

/**
 * Fetch historical rule version from database (for v2 multiYearExact mode)
 * This is a placeholder for the actual implementation that would fetch from Supabase
 */
export async function fetchHistoricalRule(stateCode: string, date: Date): Promise<NexusRule | null> {
  // In v1, we'll just return the current rule
  // In v2, this would fetch the appropriate historical rule from Supabase
  return getCurrentRule(stateCode);
}

/**
 * Get state name from state code
 */
export function getStateName(stateCode: string): string {
  const stateNames: Record<string, string> = {
    'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
    'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
    'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
    'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
    'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
    'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
    'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
    'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
    'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
    'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
    'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
    'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
    'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
  };
  
  return stateNames[stateCode] || stateCode;
}