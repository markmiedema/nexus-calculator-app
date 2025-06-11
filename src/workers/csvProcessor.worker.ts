// CSV Processing Web Worker
// Self-contained worker with embedded functions and data

// Embedded state thresholds
const STATE_THRESHOLDS = {
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
  'WI': { revenue: 100000, transactions: 200 },
  
  // States with no sales tax
  'MT': { revenue: 0, transactions: null },
  'NH': { revenue: 0, transactions: null },
  'OR': { revenue: 0, transactions: null },
  'DE': { revenue: 0, transactions: null }
};

// Embedded tax rates
const STATE_TAX_RATES = {
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

// State name to code mapping
const STATE_NAME_TO_CODE = {
  'ALABAMA': 'AL', 'ALASKA': 'AK', 'ARIZONA': 'AZ', 'ARKANSAS': 'AR',
  'CALIFORNIA': 'CA', 'COLORADO': 'CO', 'CONNECTICUT': 'CT', 'DELAWARE': 'DE',
  'FLORIDA': 'FL', 'GEORGIA': 'GA', 'HAWAII': 'HI', 'IDAHO': 'ID',
  'ILLINOIS': 'IL', 'INDIANA': 'IN', 'IOWA': 'IA', 'KANSAS': 'KS',
  'KENTUCKY': 'KY', 'LOUISIANA': 'LA', 'MAINE': 'ME', 'MARYLAND': 'MD',
  'MASSACHUSETTS': 'MA', 'MICHIGAN': 'MI', 'MINNESOTA': 'MN', 'MISSISSIPPI': 'MS',
  'MISSOURI': 'MO', 'MONTANA': 'MT', 'NEBRASKA': 'NE', 'NEVADA': 'NV',
  'NEW HAMPSHIRE': 'NH', 'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY',
  'NORTH CAROLINA': 'NC', 'NORTH DAKOTA': 'ND', 'OHIO': 'OH', 'OKLAHOMA': 'OK',
  'OREGON': 'OR', 'PENNSYLVANIA': 'PA', 'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC',
  'SOUTH DAKOTA': 'SD', 'TENNESSEE': 'TN', 'TEXAS': 'TX', 'UTAH': 'UT',
  'VERMONT': 'VT', 'VIRGINIA': 'VA', 'WASHINGTON': 'WA', 'WEST VIRGINIA': 'WV',
  'WISCONSIN': 'WI', 'WYOMING': 'WY', 'DISTRICT OF COLUMBIA': 'DC'
};

// Column mapping variations
const COLUMN_MAPPINGS = {
  date: [
    'date', 'transaction_date', 'transaction date', 'sale_date', 'sale date',
    'order_date', 'order date', 'invoice_date', 'invoice date', 'created_date',
    'created date', 'timestamp', 'time', 'when', 'datetime', 'date_time',
    'purchase_date', 'purchase date', 'billing_date', 'billing date'
  ],
  state: [
    'state', 'state_code', 'state code', 'st', 'province', 'region',
    'ship_to_state', 'ship to state', 'shipping_state', 'shipping state',
    'bill_to_state', 'bill to state', 'billing_state', 'billing state',
    'customer_state', 'customer state', 'destination_state', 'destination state',
    'delivery_state', 'delivery state'
  ],
  sale_amount: [
    'sale_amount', 'sale amount', 'amount', 'total', 'total_amount', 'total amount',
    'revenue', 'sales', 'gross_amount', 'gross amount', 'net_amount', 'net amount',
    'price', 'value', 'invoice_amount', 'invoice amount', 'order_total', 'order total',
    'subtotal', 'sub_total', 'sub total', 'line_total', 'line total',
    'extended_price', 'extended price', 'sales amount ($)'
  ],
  transaction_count: [
    'transaction_count', 'transaction count', 'transactions', 'quantity', 'qty',
    'units', 'items', 'line_items', 'line items', 'order_count', 'order count',
    'invoice_count', 'invoice count', 'sales_count', 'sales count',
    'number_of_transactions', 'num_transactions', 'trans_count', 'item_count',
    'product_count'
  ],
  city: [
    'city', 'customer_city', 'customer city', 'billing_city', 'billing city',
    'shipping_city', 'shipping city', 'ship_to_city', 'ship to city',
    'bill_to_city', 'bill to city', 'destination_city', 'destination city',
    'delivery_city', 'delivery city', 'town', 'municipality', 'locality'
  ],
  county: [
    'county', 'customer_county', 'customer county', 'billing_county', 'billing county',
    'shipping_county', 'shipping county', 'ship_to_county', 'ship to county',
    'bill_to_county', 'bill to county', 'destination_county', 'destination county',
    'delivery_county', 'delivery county', 'parish', 'borough'
  ],
  zip_code: [
    'zip_code', 'zip code', 'zip', 'postal_code', 'postal code', 'postcode',
    'zipcode', 'customer_zip', 'customer zip', 'billing_zip', 'billing zip',
    'shipping_zip', 'shipping zip', 'ship_to_zip', 'ship to zip',
    'bill_to_zip', 'bill to zip', 'destination_zip', 'destination zip',
    'delivery_zip', 'delivery zip'
  ]
};

// Worker message types
interface WorkerMessage {
  type: 'PROCESS_CSV' | 'PROGRESS' | 'SUCCESS' | 'ERROR';
  payload?: any;
  progress?: number;
  error?: string;
}

// Utility functions embedded in worker
const calculateSimilarity = (header: string, target: string): number => {
  const normalizedHeader = header.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();
  
  if (normalizedHeader === normalizedTarget) return 100;
  
  const cleanHeader = normalizedHeader.replace(/[_\-\s]+/g, '');
  const cleanTarget = normalizedTarget.replace(/[_\-\s]+/g, '');
  
  if (cleanHeader === cleanTarget) return 95;
  
  // Special handling for county vs count disambiguation
  if (normalizedHeader === 'county' && normalizedTarget === 'count') return 30;
  if (normalizedHeader === 'count' && normalizedTarget === 'county') return 30;
  
  const headerWords = normalizedHeader.split(/[_\-\s]+/);
  const targetWords = normalizedTarget.split(/[_\-\s]+/);
  
  if (targetWords.every(word => headerWords.includes(word))) return 90;
  
  let matchingChars = 0;
  const maxLength = Math.max(normalizedHeader.length, normalizedTarget.length);
  
  for (let i = 0; i < Math.min(normalizedHeader.length, normalizedTarget.length); i++) {
    if (normalizedHeader[i] === normalizedTarget[i]) {
      matchingChars++;
    }
  }
  
  if (normalizedHeader.includes(normalizedTarget) || normalizedTarget.includes(normalizedHeader)) {
    return Math.max(70, (matchingChars / maxLength) * 100 + 20);
  }
  
  return (matchingChars / maxLength) * 100;
};

const detectColumns = (rawHeaders: string[]) => {
  const mapping: { [standardName: string]: string | null } = {};
  const confidence: { [standardName: string]: number } = {};
  const usedHeaders = new Set<string>();
  
  const detectionOrder = ['date', 'state', 'sale_amount', 'county', 'city', 'zip_code', 'transaction_count'];
  
  for (const standardName of detectionOrder) {
    const variations = COLUMN_MAPPINGS[standardName];
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    for (const rawHeader of rawHeaders) {
      if (usedHeaders.has(rawHeader)) continue;
      
      let maxScore = 0;
      
      for (const variation of variations) {
        const score = calculateSimilarity(rawHeader, variation);
        maxScore = Math.max(maxScore, score);
      }
      
      if (standardName === 'county' && rawHeader.toLowerCase() === 'county') {
        maxScore = 100;
      }
      
      if (standardName === 'transaction_count' && rawHeader.toLowerCase() === 'county') {
        maxScore = 0;
      }
      
      if (maxScore > bestScore) {
        bestScore = maxScore;
        bestMatch = rawHeader;
      }
    }
    
    if (bestMatch && bestScore >= 60) {
      mapping[standardName] = bestMatch;
      confidence[standardName] = bestScore;
      usedHeaders.add(bestMatch);
    } else {
      mapping[standardName] = null;
      confidence[standardName] = 0;
    }
  }
  
  const unmappedHeaders = rawHeaders.filter(header => !usedHeaders.has(header));
  
  return { mapping, confidence, unmappedHeaders };
};

const cleanCurrencyValue = (value: any): number | null => {
  if (value === null || value === undefined || value === '') return null;
  
  let stringValue = String(value).trim();
  
  // Handle negative amounts in parentheses
  const parenthesesMatch = stringValue.match(/^\(([^)]+)\)$/);
  if (parenthesesMatch) {
    stringValue = '-' + parenthesesMatch[1];
  }
  
  // Remove currency symbols and formatting
  stringValue = stringValue.replace(/[$£€¥₹₽¢]/g, '');
  stringValue = stringValue.replace(/[,\s]/g, '');
  stringValue = stringValue.replace(/['"]/g, '');
  
  const numericValue = parseFloat(stringValue);
  return isNaN(numericValue) ? null : numericValue;
};

const cleanDateValue = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  
  if (typeof value === 'number') {
    try {
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      return date.toISOString().split('T')[0];
    } catch (error) {
      return null;
    }
  }
  
  let stringValue = String(value).trim();
  
  // Handle MM/DD/YYYY or MM/DD/YY
  const mmddyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/;
  if (mmddyyRegex.test(stringValue)) {
    const [, month, day, year] = mmddyyRegex.exec(stringValue)!;
    let fullYear = year;
    if (year.length === 2) {
      const yearNum = parseInt(year);
      fullYear = yearNum < 50 ? `20${year}` : `19${year}`;
    }
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle MM-DD-YYYY
  const mmddyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/;
  if (mmddyyyyRegex.test(stringValue)) {
    const [, month, day, year] = mmddyyyyRegex.exec(stringValue)!;
    let fullYear = year;
    if (year.length === 2) {
      const yearNum = parseInt(year);
      fullYear = yearNum < 50 ? `20${year}` : `19${year}`;
    }
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  try {
    const date = new Date(stringValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (error) {
    // Fall through to return null
  }
  
  return null;
};

const cleanStateValue = (value: any): string | null => {
  if (value === null || value === undefined || value === '') return null;
  
  let stringValue = String(value).trim().toUpperCase();
  
  // Check if it's already a valid state code
  if (STATE_THRESHOLDS[stringValue]) return stringValue;
  
  // Try to convert state name to code
  if (STATE_NAME_TO_CODE[stringValue]) {
    return STATE_NAME_TO_CODE[stringValue];
  }
  
  // Try partial matching for common abbreviations
  const partialMatches = Object.keys(STATE_NAME_TO_CODE).filter(name => 
    name.includes(stringValue) || stringValue.includes(name.substring(0, 4))
  );
  
  if (partialMatches.length === 1) {
    return STATE_NAME_TO_CODE[partialMatches[0]];
  }
  
  // Common variations
  const commonVariations: Record<string, string> = {
    'CALIF': 'CA', 'FLA': 'FL', 'TEX': 'TX', 'MASS': 'MA', 'PENN': 'PA',
    'WASH': 'WA', 'MICH': 'MI', 'ILL': 'IL', 'CONN': 'CT', 'WISC': 'WI'
  };
  
  return commonVariations[stringValue] || null;
};

const cleanIntegerValue = (value: any): number => {
  if (value === null || value === undefined || value === '') return 1;
  
  let stringValue = String(value).trim().replace(/[,\s]/g, '');
  const intValue = parseInt(stringValue);
  
  return isNaN(intValue) || intValue <= 0 ? 1 : intValue;
};

const cleanTextValue = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  
  const stringValue = String(value).trim().replace(/\s+/g, ' ');
  return stringValue || null;
};

const processDataRow = (row: any, mapping: any) => {
  const cleanedRow: any = {};
  
  for (const [standardName, detectedHeader] of Object.entries(mapping)) {
    if (!detectedHeader || !(detectedHeader in row)) continue;
    
    const originalValue = row[detectedHeader];
    
    switch (standardName) {
      case 'date':
        cleanedRow[standardName] = cleanDateValue(originalValue);
        break;
      case 'state':
        cleanedRow[standardName] = cleanStateValue(originalValue);
        break;
      case 'sale_amount':
        cleanedRow[standardName] = cleanCurrencyValue(originalValue);
        break;
      case 'transaction_count':
        cleanedRow[standardName] = cleanIntegerValue(originalValue);
        break;
      case 'city':
      case 'county':
      case 'zip_code':
      case 'customer_address':
        cleanedRow[standardName] = cleanTextValue(originalValue);
        break;
      default:
        cleanedRow[standardName] = originalValue;
    }
  }
  
  // Copy unmapped columns
  for (const [key, value] of Object.entries(row)) {
    if (!Object.values(mapping).includes(key)) {
      cleanedRow[key] = value;
    }
  }
  
  return cleanedRow;
};

const aggregateSalesByState = (data: any[]) => {
  const salesByState: any = {};
  
  data.forEach(row => {
    const state = row.state;
    const date = row.date;
    const year = date.substring(0, 4);
    const amount = row.sale_amount || 0;
    const transactionCount = row.transaction_count || 1;
    
    if (!salesByState[state]) {
      salesByState[state] = {
        annualSales: {},
        totalRevenue: 0,
        transactionCount: 0,
        monthlyRevenue: [],
      };
    }
    
    if (!salesByState[state].annualSales[year]) {
      salesByState[state].annualSales[year] = {
        totalRevenue: 0,
        transactionCount: 0,
        firstTransactionDate: date,
      };
    }
    
    salesByState[state].annualSales[year].totalRevenue += amount;
    salesByState[state].annualSales[year].transactionCount += transactionCount;
    if (date < salesByState[state].annualSales[year].firstTransactionDate) {
      salesByState[state].annualSales[year].firstTransactionDate = date;
    }
    
    salesByState[state].totalRevenue += amount;
    salesByState[state].transactionCount += transactionCount;
    
    const month = date.substring(0, 7);
    const existingMonth = salesByState[state].monthlyRevenue.find((m: any) => m.date.startsWith(month));
    
    if (existingMonth) {
      existingMonth.revenue += amount;
      existingMonth.transactions += transactionCount;
    } else {
      salesByState[state].monthlyRevenue.push({
        date: month + '-01',
        revenue: amount,
        transactions: transactionCount,
      });
    }
  });
  
  return salesByState;
};

const determineNexusStates = (salesByState: any) => {
  const nexusStates: any[] = [];
  
  Object.entries(salesByState).forEach(([stateCode, data]: [string, any]) => {
    const thresholds = STATE_THRESHOLDS[stateCode] || { revenue: 100000, transactions: 200 };
    let earliestNexusDate: string | null = null;
    let nexusTriggeredBy: 'revenue' | 'transactions' = 'revenue';
    
    Object.entries(data.annualSales).forEach(([year, yearData]: [string, any]) => {
      const hasRevenueNexus = yearData.totalRevenue >= thresholds.revenue;
      const hasTransactionNexus = thresholds.transactions !== null && 
        yearData.transactionCount >= thresholds.transactions;
      
      if (hasRevenueNexus || hasTransactionNexus) {
        const nexusDate = yearData.firstTransactionDate;
        if (!earliestNexusDate || nexusDate < earliestNexusDate) {
          earliestNexusDate = nexusDate;
          nexusTriggeredBy = hasRevenueNexus ? 'revenue' : 'transactions';
        }
      }
    });
    
    if (earliestNexusDate) {
      const taxRate = STATE_TAX_RATES[stateCode] || 0;
      const liability = Math.round(data.totalRevenue * (taxRate / 100));
      
      nexusStates.push({
        code: stateCode,
        name: getStateName(stateCode),
        totalRevenue: data.totalRevenue,
        transactionCount: data.transactionCount,
        monthlyRevenue: data.monthlyRevenue,
        nexusDate: earliestNexusDate,
        thresholdTriggered: nexusTriggeredBy,
        revenueThreshold: thresholds.revenue,
        transactionThreshold: thresholds.transactions,
        registrationDeadline: calculateRegistrationDeadline(earliestNexusDate),
        filingFrequency: determineFilingFrequency(data.totalRevenue),
        taxRate: Number(taxRate.toFixed(2)),
        liability,
        preNexusRevenue: 0,
        postNexusRevenue: data.totalRevenue,
        effectiveDate: earliestNexusDate,
        annualData: {}
      });
    }
  });
  
  return nexusStates;
};

const getStateName = (stateCode: string): string => {
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
};

const calculateRegistrationDeadline = (nexusDate: string): string => {
  const date = new Date(nexusDate);
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
};

const determineFilingFrequency = (revenue: number): string => {
  if (revenue > 1000000) return 'Monthly';
  if (revenue > 50000) return 'Quarterly';
  return 'Annually';
};

// Main processing function
const processCSVData = async (data: any[], onProgress: (progress: number) => void) => {
  try {
    onProgress(10);
    
    if (data.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    // Detect columns
    const rawHeaders = Object.keys(data[0]);
    const detectionResult = detectColumns(rawHeaders);
    onProgress(20);
    
    // Validate required columns
    const requiredColumns = ['date', 'state', 'sale_amount'];
    const missingRequired = requiredColumns.filter(col => !detectionResult.mapping[col]);
    
    if (missingRequired.length > 0) {
      throw new Error(`Missing required columns: ${missingRequired.join(', ')}`);
    }
    
    onProgress(30);
    
    // Clean and process data
    const cleanedData: any[] = [];
    const batchSize = 1000;
    
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const row of batch) {
        const cleanedRow = processDataRow(row, detectionResult.mapping);
        
        // Validate required fields
        if (cleanedRow.date && cleanedRow.state && cleanedRow.sale_amount !== null) {
          cleanedData.push(cleanedRow);
        }
      }
      
      const progress = 30 + Math.floor((i / data.length) * 40);
      onProgress(progress);
      
      // Yield control to prevent blocking
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    onProgress(70);
    
    // Aggregate sales by state
    const salesByState = aggregateSalesByState(cleanedData);
    onProgress(80);
    
    // Determine nexus states
    const nexusStates = determineNexusStates(salesByState);
    onProgress(90);
    
    // Calculate totals and format results
    const totalLiability = nexusStates.reduce((sum: number, state: any) => sum + state.liability, 0);
    const priorityStates = [...nexusStates]
      .sort((a: any, b: any) => b.liability - a.liability)
      .slice(0, 5);
    
    // Determine data range
    const allDates = cleanedData.map(row => new Date(row.date));
    const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Extract available years
    const availableYears = [...new Set(cleanedData.map(row => row.date.substring(0, 4)))].sort();
    
    // Format sales by state
    const formattedSalesByState = Object.entries(salesByState).map(([stateCode, stateData]: [string, any]) => {
      const thresholds = STATE_THRESHOLDS[stateCode] || { revenue: 100000, transactions: 200 };
      const taxRate = STATE_TAX_RATES[stateCode] || 0;
      
      const currentYear = new Date().getFullYear().toString();
      const currentYearData = stateData.annualSales[currentYear] || {
        totalRevenue: 0,
        transactionCount: 0
      };
      
      const revenueProximity = thresholds.revenue > 0 
        ? Number(((currentYearData.totalRevenue / thresholds.revenue) * 100).toFixed(2))
        : 0;
      
      const transactionProximity = thresholds.transactions 
        ? Number(((currentYearData.transactionCount / thresholds.transactions) * 100).toFixed(2))
        : 0;
      
      const thresholdProximity = Number(Math.max(revenueProximity, transactionProximity).toFixed(2));
      
      return {
        code: stateCode,
        name: getStateName(stateCode),
        totalRevenue: stateData.totalRevenue,
        transactionCount: stateData.transactionCount,
        monthlyRevenue: stateData.monthlyRevenue,
        revenueThreshold: thresholds.revenue,
        transactionThreshold: thresholds.transactions,
        thresholdProximity,
        taxRate: Number(taxRate.toFixed(2)),
        annualData: {}
      };
    });
    
    onProgress(100);
    
    return {
      nexusStates,
      totalLiability,
      priorityStates,
      salesByState: formattedSalesByState,
      dataRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      availableYears,
    };
    
  } catch (error) {
    throw new Error(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Worker message handler
self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  try {
    switch (type) {
      case 'PROCESS_CSV':
        const result = await processCSVData(payload, (progress: number) => {
          self.postMessage({
            type: 'PROGRESS',
            progress
          } as WorkerMessage);
        });
        
        self.postMessage({
          type: 'SUCCESS',
          payload: result
        } as WorkerMessage);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    } as WorkerMessage);
  }
};

// Export for TypeScript (won't be used in worker context)
export {};