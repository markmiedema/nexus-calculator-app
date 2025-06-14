// Nexus Engine Types
// Core type definitions for the Nexus Analyzer calculation engine

/**
 * Represents a single transaction row from imported data
 */
export interface TransactionRow {
  id: string;               // unique in file
  state_code: string;       // ISO-2
  amount: number;           // USD; can be negative
  date: Date;               // UTC
  revenue_type?: 'taxable' | 'nontaxable' | 'marketplace';
}

/**
 * Configuration options for the Nexus Engine
 */
export interface EngineOptions {
  mode: 'singleYear' | 'multiYearEstimate' | 'multiYearExact';
  analysisYear?: number;            // single-year mode
  yearRange?: [number, number];     // multi-year modes
  ignoreMarketplace?: boolean;      // drop marketplace-facilitator rows
  includeNegativeAmounts?: boolean; // whether to include negative amounts (returns/refunds)
}

/**
 * Result of nexus calculation for a single state
 */
export interface NexusResult {
  state_code: string;
  exceeded: boolean;
  // v1-only fields
  first_breach_date?: Date;
  first_breach_transaction_id?: string;
  estimate_mode?: boolean;
  // v2 fields
  period_qualified?: string;        // e.g., "FY-2022", "2024-03 (rolling-12)"
  rule_version_id?: string;
  
  // Additional fields for detailed reporting
  total_revenue?: number;
  total_transactions?: number;
  threshold_revenue?: number;
  threshold_transactions?: number | null;
  breach_type?: 'revenue' | 'transactions' | null;
  threshold_percentage?: number;
}

/**
 * Nexus rule definition for a state
 */
export interface NexusRule {
  state_code: string;
  amount: number;           // Revenue threshold in USD
  txn: number | null;       // Transaction count threshold (null if N/A)
  effective_date: Date;     // When this rule version became effective
  end_date?: Date;          // When this rule version was superseded
  rule_id: string;          // Unique identifier for this rule version
}

/**
 * Cumulative breach calculation result
 */
export interface BreachResult {
  sum: number;              // Cumulative sum at breach point
  cnt: number;              // Cumulative count at breach point
  breachIdx: number;        // Index of breaching transaction (-1 if no breach)
  breachType: 'revenue' | 'transactions' | null; // Which threshold was breached
}

/**
 * Summary statistics for a state
 */
export interface StateStats {
  state_code: string;
  total_revenue: number;
  total_transactions: number;
  threshold_revenue: number;
  threshold_transactions: number | null;
  threshold_percentage: number;
}

/**
 * Engine processing result
 */
export interface EngineResult {
  nexusResults: NexusResult[];
  stateStats: StateStats[];
  warnings: string[];
  processingTime: number;
  rowsProcessed: number;
}