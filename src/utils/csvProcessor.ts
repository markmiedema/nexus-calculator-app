import { ProcessedData, NexusState, MonthlyRevenue } from '../types';
import { validateCSV } from './dataValidation';
import { calculateNexus } from './nexusCalculator';
import { calculateTaxLiability } from './taxCalculator';
import { determineStateThresholds } from '../constants/stateThresholds';
import { getStateTaxRate } from '../constants/taxRates';
import * as XLSX from 'xlsx';

interface AnnualSales {
  [year: string]: {
    totalRevenue: number;
    transactionCount: number;
    monthlyRevenue: MonthlyRevenue[];
    firstTransactionDate: string;
  };
}

interface StateSales {
  [stateCode: string]: {
    annualSales: AnnualSales;
    totalRevenue: number;
    transactionCount: number;
    monthlyRevenue: MonthlyRevenue[];
  };
}

const formatExcelDate = (serial: number): string => {
  // Excel dates are number of days since 1900-01-01
  // Convert to JavaScript Date and then to YYYY-MM-DD
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
};

const normalizeDateString = (dateStr: string): string => {
  // Handle various date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format. Expected YYYY-MM-DD, got '${dateStr}'`);
  }
  return date.toISOString().split('T')[0];
};

export const processCSVData = async (file: File): Promise<ProcessedData> => {
  try {
    // Read the file as array buffer
    const buffer = await readFileAsArrayBuffer(file);
    
    // Parse workbook
    const workbook = XLSX.read(buffer, { type: 'array' });
    
    // Combine data from all worksheets
    const combinedData: any[] = [];
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      combinedData.push(...sheetData);
    });

    // Process dates - handle both Excel dates and string dates
    const processedData = combinedData.map(row => ({
      ...row,
      date: typeof row.date === 'number' 
        ? formatExcelDate(row.date) 
        : normalizeDateString(row.date)
    }));
    
    // Validate the processed data
    validateCSV(processedData);
    
    // Process the data to determine nexus by year
    const salesByState = aggregateSalesByState(processedData);
    
    // Calculate nexus for each state based on annual thresholds
    const nexusStates = determineNexusStates(salesByState);
    
    // Calculate tax liability
    const statesWithLiability = calculateTaxLiabilities(nexusStates);
    
    // Determine priority states (highest liability)
    const priorityStates = [...statesWithLiability]
      .sort((a, b) => b.liability - a.liability)
      .slice(0, 5);
    
    // Calculate total liability
    const totalLiability = statesWithLiability.reduce(
      (sum, state) => sum + state.liability, 
      0
    );
    
    // Determine data range
    const allDates = processedData.map(row => new Date(row.date));
    const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));

    // Extract available years from the data
    const availableYears = [...new Set(processedData.map(row => row.date.substring(0, 4)))].sort();

    // Format salesByState for the return value
    const formattedSalesByState = Object.entries(salesByState).map(([stateCode, data]) => {
      const thresholds = determineStateThresholds(stateCode);
      const taxRate = getStateTaxRate(stateCode);
      
      // Calculate current year's threshold proximity
      const currentYear = new Date().getFullYear().toString();
      const currentYearData = data.annualSales[currentYear] || {
        totalRevenue: 0,
        transactionCount: 0
      };
      
      // Calculate threshold proximity as a percentage, rounded to 2 decimal places
      const revenueProximity = thresholds.revenue > 0 
        ? Number(((currentYearData.totalRevenue / thresholds.revenue) * 100).toFixed(2))
        : 0;
      
      const transactionProximity = thresholds.transactions 
        ? Number(((currentYearData.transactionCount / thresholds.transactions) * 100).toFixed(2))
        : 0;
      
      // Use the higher proximity percentage
      const thresholdProximity = Number(Math.max(revenueProximity, transactionProximity).toFixed(2));

      return {
        code: stateCode,
        name: getStateName(stateCode),
        totalRevenue: data.totalRevenue,
        transactionCount: data.transactionCount,
        monthlyRevenue: data.monthlyRevenue,
        revenueThreshold: thresholds.revenue,
        transactionThreshold: thresholds.transactions,
        thresholdProximity,
        taxRate: Number(taxRate.toFixed(2))
      };
    });
    
    return {
      nexusStates: statesWithLiability,
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
    console.error('Error processing file:', error);
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsArrayBuffer(file);
  });
};

const parseCSV = (text: string): any[] => {
  const lines = text.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: Record<string, any> = {};
    
    headers.forEach((header, i) => {
      row[header] = values[i] || '';
    });
    
    return row;
  });
};

const aggregateSalesByState = (data: any[]): StateSales => {
  const salesByState: StateSales = {};
  
  data.forEach(row => {
    const state = row.state.toUpperCase();
    const date = row.date;
    const year = date.substring(0, 4);
    const amount = parseFloat(row.sale_amount);
    const transactionCount = row.transaction_count ? parseInt(row.transaction_count) : 1;
    
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
        monthlyRevenue: [],
        firstTransactionDate: date,
      };
    }
    
    // Update annual totals
    salesByState[state].annualSales[year].totalRevenue += amount;
    salesByState[state].annualSales[year].transactionCount += transactionCount;
    if (date < salesByState[state].annualSales[year].firstTransactionDate) {
      salesByState[state].annualSales[year].firstTransactionDate = date;
    }
    
    // Update overall totals
    salesByState[state].totalRevenue += amount;
    salesByState[state].transactionCount += transactionCount;
    
    // Track monthly revenue
    const month = date.substring(0, 7); // YYYY-MM
    const existingMonth = salesByState[state].monthlyRevenue.find(m => m.date.startsWith(month));
    
    if (existingMonth) {
      existingMonth.revenue += amount;
      existingMonth.transactions += transactionCount;
    } else {
      salesByState[state].monthlyRevenue.push({
        date: month + '-01', // First day of month
        revenue: amount,
        transactions: transactionCount,
      });
    }
  });
  
  return salesByState;
};

const determineNexusStates = (salesByState: StateSales): NexusState[] => {
  const nexusStates: NexusState[] = [];
  
  Object.entries(salesByState).forEach(([stateCode, data]) => {
    const thresholds = determineStateThresholds(stateCode);
    let earliestNexusDate: string | null = null;
    let nexusTriggeredBy: 'revenue' | 'transactions' = 'revenue';
    
    // Check each year for nexus
    Object.entries(data.annualSales).forEach(([year, yearData]) => {
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
        taxRate: 0,
        liability: 0,
        preNexusRevenue: 0,
        postNexusRevenue: 0,
        effectiveDate: earliestNexusDate
      });
    }
  });
  
  return nexusStates;
};

const calculateTaxLiabilities = (states: NexusState[]): NexusState[] => {
  return states.map(state => {
    const { liability, taxRate } = calculateTaxLiability(
      state.code,
      state.totalRevenue,
      state.nexusDate,
      state.monthlyRevenue
    );
    
    return {
      ...state,
      liability,
      taxRate: Number(taxRate.toFixed(2)),
    };
  });
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