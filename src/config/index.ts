// Configuration for data validation
export const VALIDATION_CONFIG = {
  requiredColumns: ['date', 'state', 'sale_amount'],
  maxYearSpan: 4,
  stateCodePattern: /^[A-Z]{2}$/
} as const;

// Application configuration
export const APP_CONFIG = {
  maxPriorityStates: 5,
  gracePeriodDays: 30,
  maxFileSize: 50 * 1024 * 1024, // 50MB
  defaultFilingThresholds: {
    monthly: 1000000,
    quarterly: 50000
  },
  dateFormats: {
    chart: { month: 'short', year: '2-digit' }
  },
  chartColors: {
    primary: '#3B82F6',    // Blue
    secondary: '#10B981',  // Green
    danger: '#EF4444',     // Red
    grid: '#E5E7EB'        // Light gray
  }
} as const;