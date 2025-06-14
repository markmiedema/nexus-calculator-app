// CSV data types
export interface CSVRow {
  date: string | number;
  state: string;
  sale_amount: string | number;
  transaction_count?: string | number;
  customer_address?: string;
}

export interface ProcessedCSVRow {
  date: string;
  state: string;
  sale_amount: number;
  transaction_count: number;
  customer_address?: string;
}

// Sales data types
export interface SalesDataRow {
  date: string;
  state: string;
  sale_amount: number;
  transaction_count?: number;
  customer_address?: string;
}

export interface MonthlyRevenue {
  date: string;
  revenue: number;
  transactions: number;
}

// Sales by state information
export interface SalesByState {
  code: string;
  name: string;
  totalRevenue: number;
  transactionCount: number;
  monthlyRevenue: MonthlyRevenue[];
  revenueThreshold: number;
  transactionThreshold: number | null;
  thresholdProximity: number;
  taxRate: number;
  annualData: {
    [year: string]: {
      revenue: number;
      transactions: number;
      thresholdProximity: number;
    };
  };
}

// Nexus state information
export interface NexusState {
  code: string;
  name: string;
  totalRevenue: number;
  transactionCount: number;
  monthlyRevenue: MonthlyRevenue[];
  nexusDate: string;
  thresholdTriggered: 'revenue' | 'transactions';
  revenueThreshold: number;
  transactionThreshold: number | null;
  registrationDeadline: string;
  filingFrequency: string;
  taxRate: number;
  liability: number;
  preNexusRevenue: number;
  postNexusRevenue: number;
  effectiveDate: string;
  annualData: {
    [year: string]: {
      revenue: number;
      transactions: number;
      liability: number;
    };
  };
  yearlyBreaches?: {
    [year: string]: {
      hasNexus: boolean;
      nexusDate: string | null;
      thresholdType: 'revenue' | 'transactions' | null;
      revenue: number;
      transactions: number;
    }
  };
}

// Year selection context
export interface YearSelectionContextType {
  selectedYears: string[];
  availableYears: string[];
  toggleYear: (year: string) => void;
  selectAllYears: () => void;
  clearAllYears: () => void;
}

// Processed data result
export interface ProcessedData {
  nexusStates: NexusState[];
  totalLiability: number;
  priorityStates: NexusState[];
  dataRange: {
    start: string;
    end: string;
  };
  salesByState: SalesByState[];
  availableYears: string[];
}