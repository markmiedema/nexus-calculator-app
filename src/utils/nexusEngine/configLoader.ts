// Config Loader for Nexus Engine
// Loads YAML configuration files and converts them to typed objects

import yaml from 'js-yaml';
import { NexusRule } from './types';

/**
 * State rule configuration from YAML
 */
interface YamlStateRule {
  amount: number;
  transactions: number | null;
  effective_date: string;
  end_date?: string | null;
  rule_id: string;
  notes?: string;
}

/**
 * Complete YAML configuration structure
 */
interface YamlConfig {
  version: string;
  last_updated: string;
  source: string;
  states: Record<string, YamlStateRule>;
  historical_rules?: Record<string, YamlStateRule>;
}

/**
 * Tax rate configuration from YAML
 */
interface YamlTaxRate {
  state_rate: number;
  avg_local_rate: number;
  combined_rate: number;
  max_local_rate: number;
  notes?: string;
}

interface YamlTaxRatesConfig {
  version: string;
  last_updated: string;
  source: string;
  source_url?: string;
  rates: Record<string, YamlTaxRate>;
}

/**
 * Load state rules from YAML configuration
 *
 * In production, this would fetch from server or be bundled with the app.
 * For now, we'll return the parsed rules from the shared config.
 */
export async function loadStateRules(): Promise<NexusRule[]> {
  try {
    // In a real implementation, this would fetch the YAML file
    // For now, we'll use the hardcoded rules but show how to parse YAML

    // This is what the code would look like:
    // const response = await fetch('/shared/config/state_rules.yaml');
    // const yamlText = await response.text();
    // const config = yaml.load(yamlText) as YamlConfig;

    // For now, return converted rules from our existing data
    // This will be replaced when we set up proper YAML loading
    const rules = await loadRulesFromYaml();
    return rules;
  } catch (error) {
    console.error('Failed to load state rules from YAML:', error);
    // Fall back to hardcoded rules if YAML fails
    return loadFallbackRules();
  }
}

/**
 * Load tax rates from YAML configuration
 */
export async function loadTaxRates(): Promise<Record<string, number>> {
  try {
    // In production, would fetch from server
    // const response = await fetch('/shared/config/tax_rates.yaml');
    // const yamlText = await response.text();
    // const config = yaml.load(yamlText) as YamlTaxRatesConfig;

    const rates = await loadTaxRatesFromYaml();
    return rates;
  } catch (error) {
    console.error('Failed to load tax rates from YAML:', error);
    return loadFallbackTaxRates();
  }
}

/**
 * Parse YAML text into state rules
 */
export function parseStateRulesYaml(yamlText: string): NexusRule[] {
  const config = yaml.load(yamlText) as YamlConfig;

  if (!config.states) {
    throw new Error('Invalid YAML configuration: missing states section');
  }

  const rules: NexusRule[] = [];

  for (const [stateCode, stateRule] of Object.entries(config.states)) {
    rules.push({
      state_code: stateCode,
      amount: stateRule.amount,
      txn: stateRule.transactions,
      effective_date: new Date(stateRule.effective_date),
      end_date: stateRule.end_date ? new Date(stateRule.end_date) : undefined,
      rule_id: stateRule.rule_id
    });
  }

  return rules;
}

/**
 * Parse YAML text into tax rates
 */
export function parseTaxRatesYaml(yamlText: string): Record<string, number> {
  const config = yaml.load(yamlText) as YamlTaxRatesConfig;

  if (!config.rates) {
    throw new Error('Invalid YAML configuration: missing rates section');
  }

  const rates: Record<string, number> = {};

  for (const [stateCode, rateInfo] of Object.entries(config.rates)) {
    // Use combined rate (state + average local)
    rates[stateCode] = rateInfo.combined_rate;
  }

  return rates;
}

/**
 * Validate YAML configuration against schema
 */
export function validateStateRulesConfig(config: YamlConfig): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!config.version) {
    errors.push('Missing required field: version');
  }

  if (!config.last_updated) {
    errors.push('Missing required field: last_updated');
  }

  if (!config.states || typeof config.states !== 'object') {
    errors.push('Missing or invalid states section');
    return errors; // Can't continue validation
  }

  // Validate each state
  for (const [stateCode, rule] of Object.entries(config.states)) {
    // Validate state code format
    if (!/^[A-Z]{2}$/.test(stateCode)) {
      errors.push(`Invalid state code: ${stateCode} (must be 2 uppercase letters)`);
    }

    // Validate amount
    if (typeof rule.amount !== 'number' || rule.amount < 0) {
      errors.push(`Invalid amount for ${stateCode}: must be non-negative number`);
    }

    // Validate transactions
    if (rule.transactions !== null && (typeof rule.transactions !== 'number' || rule.transactions < 1)) {
      errors.push(`Invalid transactions for ${stateCode}: must be null or positive number`);
    }

    // Validate rule_id format
    if (!rule.rule_id || !/^[A-Z]{2}-\d{4}-\d{2}$/.test(rule.rule_id)) {
      errors.push(`Invalid rule_id for ${stateCode}: must match format XX-YYYY-NN`);
    }

    // Validate dates
    try {
      new Date(rule.effective_date);
    } catch {
      errors.push(`Invalid effective_date for ${stateCode}: ${rule.effective_date}`);
    }

    if (rule.end_date) {
      try {
        const endDate = new Date(rule.end_date);
        const effectiveDate = new Date(rule.effective_date);
        if (endDate <= effectiveDate) {
          errors.push(`end_date must be after effective_date for ${stateCode}`);
        }
      } catch {
        errors.push(`Invalid end_date for ${stateCode}: ${rule.end_date}`);
      }
    }
  }

  return errors;
}

/**
 * Temporary function to load rules from YAML
 * This will be replaced with actual file loading in production
 */
async function loadRulesFromYaml(): Promise<NexusRule[]> {
  // For now, import from the existing rules file
  // In production, this would use fetch() or fs.readFile()
  const { CURRENT_NEXUS_RULES } = await import('./rules');
  return CURRENT_NEXUS_RULES;
}

/**
 * Temporary function to load tax rates from YAML
 */
async function loadTaxRatesFromYaml(): Promise<Record<string, number>> {
  // For now, use hardcoded rates
  // In production, would parse from YAML
  const rates: Record<string, number> = {
    'AL': 9.22, 'AK': 1.76, 'AZ': 8.40, 'AR': 9.47, 'CA': 8.68, 'CO': 7.72,
    'CT': 6.35, 'DE': 0.00, 'FL': 7.08, 'GA': 7.35, 'HI': 4.44, 'ID': 6.03,
    'IL': 9.08, 'IN': 7.00, 'IA': 6.94, 'KS': 8.69, 'KY': 6.00, 'LA': 9.52,
    'ME': 5.50, 'MD': 6.00, 'MA': 6.25, 'MI': 6.00, 'MN': 7.46, 'MS': 7.07,
    'MO': 8.18, 'MT': 0.00, 'NE': 6.94, 'NV': 8.23, 'NH': 0.00, 'NJ': 6.60,
    'NM': 7.83, 'NY': 8.52, 'NC': 6.98, 'ND': 6.86, 'OH': 7.23, 'OK': 8.95,
    'OR': 0.00, 'PA': 6.34, 'RI': 7.00, 'SC': 7.46, 'SD': 6.40, 'TN': 9.55,
    'TX': 8.19, 'UT': 7.19, 'VT': 6.24, 'VA': 5.73, 'WA': 9.23, 'WV': 6.41,
    'WI': 5.43, 'WY': 5.33, 'DC': 6.00
  };
  return rates;
}

/**
 * Fallback rules if YAML loading fails
 */
function loadFallbackRules(): NexusRule[] {
  // Import the existing hardcoded rules as fallback
  const { CURRENT_NEXUS_RULES } = require('./rules');
  return CURRENT_NEXUS_RULES;
}

/**
 * Fallback tax rates if YAML loading fails
 */
function loadFallbackTaxRates(): Record<string, number> {
  return {
    'AL': 9.22, 'AK': 1.76, 'AZ': 8.40, 'AR': 9.47, 'CA': 8.68, 'CO': 7.72,
    'CT': 6.35, 'DE': 0.00, 'FL': 7.08, 'GA': 7.35, 'HI': 4.44, 'ID': 6.03,
    'IL': 9.08, 'IN': 7.00, 'IA': 6.94, 'KS': 8.69, 'KY': 6.00, 'LA': 9.52,
    'ME': 5.50, 'MD': 6.00, 'MA': 6.25, 'MI': 6.00, 'MN': 7.46, 'MS': 7.07,
    'MO': 8.18, 'MT': 0.00, 'NE': 6.94, 'NV': 8.23, 'NH': 0.00, 'NJ': 6.60,
    'NM': 7.83, 'NY': 8.52, 'NC': 6.98, 'ND': 6.86, 'OH': 7.23, 'OK': 8.95,
    'OR': 0.00, 'PA': 6.34, 'RI': 7.00, 'SC': 7.46, 'SD': 6.40, 'TN': 9.55,
    'TX': 8.19, 'UT': 7.19, 'VT': 6.24, 'VA': 5.73, 'WA': 9.23, 'WV': 6.41,
    'WI': 5.43, 'WY': 5.33, 'DC': 6.00
  };
}
