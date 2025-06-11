import { ProcessedData, NexusState, MonthlyRevenue } from '../types';
import { validateCSV } from './dataValidation';
import { calculateNexus } from './nexusCalculator';
import { calculateTaxLiability } from './taxCalculator';
import { determineStateThresholds } from '../constants/stateThresholds';
import { getStateTaxRate } from '../constants/taxRates';
import { detectColumns, transformDataWithMapping, validateDetection, generateDetectionReport } from './columnDetection';
import { cleanDataset, generateCleaningReport } from './dataCleaning';
import { useWebWorker } from '../hooks/useWebWorker';
import { processCSVDataFallback, isWebWorkerSupported } from './workerFallback';
import { processDataInChunks, ChunkProgress } from './chunkProcessor';
import * as XLSX from 'xlsx';

// Progress callback type
type ProgressCallback = (progress: number) => void;

// Enhanced CSV processor with chunked processing support
export const processCSVData = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  try {
    // Read and parse the file first
    const buffer = await readFileAsArrayBuffer(file);
    if (onProgress) onProgress(10);
    
    // Parse workbook
    const workbook = XLSX.read(buffer, { type: 'array' });
    if (onProgress) onProgress(20);
    
    // Combine data from all worksheets
    const combinedData: any[] = [];
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      combinedData.push(...sheetData);
    });
    
    if (combinedData.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    if (onProgress) onProgress(30);

    // Determine processing strategy based on data size
    const shouldUseChunkedProcessing = combinedData.length > 5000;
    const shouldUseWebWorker = isWebWorkerSupported() && combinedData.length > 1000;

    if (shouldUseChunkedProcessing) {
      // Use chunked processing for large datasets
      return await processWithChunkedStrategy(combinedData, onProgress);
    } else if (shouldUseWebWorker) {
      // Use Web Worker for medium datasets
      return await processWithWorkerStrategy(combinedData, onProgress);
    } else {
      // Use fallback for small datasets
      if (onProgress) onProgress(35);
      return await processCSVDataFallback(combinedData, (progress) => {
        if (onProgress) {
          const adjustedProgress = 35 + (progress * 0.65);
          onProgress(adjustedProgress);
        }
      });
    }

  } catch (error) {
    console.error('Error processing file:', error);
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Chunked processing strategy for very large datasets
const processWithChunkedStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  console.log(`Using chunked processing for ${data.length} rows`);
  
  // Initial validation and column detection
  const rawHeaders = Object.keys(data[0]);
  const detectionResult = detectColumns(rawHeaders);
  const validationResult = validateDetection(detectionResult);
  
  if (!validationResult.isValid) {
    const report = generateDetectionReport(detectionResult);
    throw new Error(`Column detection failed:\n\n${report}\n\nErrors:\n${validationResult.errors.join('\n')}`);
  }

  if (onProgress) onProgress(35);

  // Process data in chunks
  const chunkResults = await processDataInChunks(
    data,
    async (chunk: any[], chunkIndex: number) => {
      // Transform and clean chunk
      const transformedChunk = transformDataWithMapping(chunk, detectionResult.mapping);
      const { cleanedData } = cleanDataset(transformedChunk, detectionResult.mapping);
      
      // Return chunk results
      return {
        cleanedData,
        chunkIndex,
        rowCount: cleanedData.length
      };
    },
    {
      onProgress: (chunkProgress: ChunkProgress) => {
        if (onProgress) {
          // Map chunk progress to overall progress (35% to 85%)
          const adjustedProgress = 35 + (chunkProgress.overallProgress * 0.5);
          onProgress(adjustedProgress);
        }
      }
    }
  );

  if (onProgress) onProgress(85);

  // Combine chunk results
  const allCleanedData: any[] = [];
  chunkResults.forEach(result => {
    allCleanedData.push(...result.cleanedData);
  });

  console.log(`Chunked processing completed: ${allCleanedData.length} valid rows from ${data.length} total`);

  // Continue with aggregation and analysis
  return await finalizeProcessing(allCleanedData, onProgress, 85);
};

// Web Worker processing strategy for medium datasets
const processWithWorkerStrategy = async (
  data: any[],
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  console.log(`Using Web Worker processing for ${data.length} rows`);
  
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/csvProcessor.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      const { type, payload, progress, error } = event.data;

      switch (type) {
        case 'PROGRESS':
          if (onProgress && progress !== undefined) {
            const adjustedProgress = 30 + (progress * 0.7);
            onProgress(adjustedProgress);
          }
          break;

        case 'SUCCESS':
          worker.terminate();
          resolve(payload);
          break;

        case 'ERROR':
          worker.terminate();
          reject(new Error(error || 'Worker processing failed'));
          break;
      }
    };

    worker.onerror = (error) => {
      worker.terminate();
      reject(new Error(`Worker error: ${error.message}`));
    };

    worker.postMessage({
      type: 'PROCESS_CSV',
      payload: data
    });
  });
};

// Finalize processing after data cleaning
const finalizeProcessing = async (
  cleanedData: any[],
  onProgress?: ProgressCallback,
  startProgress: number = 85
): Promise<ProcessedData> => {
  // Aggregate sales by state
  const salesByState = aggregateSalesByState(cleanedData);
  if (onProgress) onProgress(startProgress + 5);
  
  // Determine nexus states
  const nexusStates = determineNexusStates(salesByState);
  if (onProgress) onProgress(startProgress + 10);
  
  // Calculate tax liabilities
  const statesWithLiability = calculateTaxLiabilities(nexusStates);
  if (onProgress) onProgress(startProgress + 12);
  
  // Determine priority states
  const priorityStates = [...statesWithLiability]
    .sort((a, b) => b.liability - a.liability)
    .slice(0, 5);
  
  // Calculate total liability
  const totalLiability = statesWithLiability.reduce(
    (sum, state) => sum + state.liability, 
    0
  );
  
  // Determine data range
  const allDates = cleanedData.map(row => new Date(row.date));
  const startDate = new Date(Math.min(...allDates.map(d => d.getTime())));
  const endDate = new Date(Math.max(...allDates.map(d => d.getTime())));

  // Extract available years
  const availableYears = [...new Set(cleanedData.map(row => row.date.substring(0, 4)))].sort();

  // Format salesByState
  const formattedSalesByState = Object.entries(salesByState).map(([stateCode, data]) => {
    const thresholds = determineStateThresholds(stateCode);
    const taxRate = getStateTaxRate(stateCode);
    
    const currentYear = new Date().getFullYear().toString();
    const currentYearData = data.annualSales[currentYear] || {
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
      totalRevenue: data.totalRevenue,
      transactionCount: data.transactionCount,
      monthlyRevenue: data.monthlyRevenue,
      revenueThreshold: thresholds.revenue,
      transactionThreshold: thresholds.transactions,
      thresholdProximity,
      taxRate: Number(taxRate.toFixed(2)),
      annualData: {}
    };
  });

  if (onProgress) onProgress(100);
  
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
};

// Original processing function (kept for fallback and compatibility)
export const processCSVDataOriginal = async (
  file: File,
  onProgress?: ProgressCallback
): Promise<ProcessedData> => {
  try {
    // Read the file as array buffer
    const buffer = await readFileAsArrayBuffer(file);
    if (onProgress) onProgress(10);
    
    // Parse workbook
    const workbook = XLSX.read(buffer, { type: 'array' });
    if (onProgress) onProgress(20);
    
    // Combine data from all worksheets
    const combinedData: any[] = [];
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const sheetData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      combinedData.push(...sheetData);
    });
    if (onProgress) onProgress(25);

    // Extract raw headers from the first row
    if (combinedData.length === 0) {
      throw new Error('CSV file is empty');
    }
    
    const rawHeaders = Object.keys(combinedData[0]);
    if (onProgress) onProgress(30);

    // Detect column mappings using smart detection
    const detectionResult = detectColumns(rawHeaders);
    const validationResult = validateDetection(detectionResult);
    
    if (!validationResult.isValid) {
      const report = generateDetectionReport(detectionResult);
      throw new Error(`Column detection failed:\n\n${report}\n\nErrors:\n${validationResult.errors.join('\n')}`);
    }
    
    if (onProgress) onProgress(35);

    // Transform data using detected column mapping
    const transformedData = transformDataWithMapping(combinedData, detectionResult.mapping);
    if (onProgress) onProgress(40);

    // Clean the transformed data
    const { cleanedData, report: cleaningReport } = cleanDataset(transformedData, detectionResult.mapping);
    if (onProgress) onProgress(45);

    // Log cleaning report for debugging
    console.log('Data Cleaning Report:', generateCleaningReport(cleaningReport));

    // Validate the cleaned data
    validateCSV(cleanedData);
    if (onProgress) onProgress(50);

    // Process dates in batches (now working with cleaned data)
    const batchSize = 1000;
    const processedData: any[] = [];
    
    await processBatch(
      cleanedData,
      batchSize,
      (batch) => {
        const processed = batch.map(row => ({
          ...row,
          // Dates should already be cleaned, but ensure they're in the right format
          date: typeof row.date === 'string' ? row.date : normalizeDateString(row.date)
        }));
        processedData.push(...processed);
      },
      (batchProgress) => {
        if (onProgress) onProgress(50 + Math.floor(batchProgress * 0.25));
      }
    );
    
    // Process the data to determine nexus by year
    const salesByState = aggregateSalesByState(processedData);
    if (onProgress) onProgress(75);
    
    // Calculate nexus for each state based on annual thresholds
    const nexusStates = determineNexusStates(salesByState);
    if (onProgress) onProgress(85);
    
    // Calculate tax liability
    const statesWithLiability = calculateTaxLiabilities(nexusStates);
    if (onProgress) onProgress(90);
    
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
      
      // Calculate threshold proximity as a percentage
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
        taxRate: Number(taxRate.toFixed(2)),
        annualData: {}
      };
    });

    if (onProgress) onProgress(100);
    
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

// Batch processing for large datasets
const processBatch = <T>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => void,
  onProgress?: ProgressCallback
): Promise<void> => {
  return new Promise((resolve) => {
    let index = 0;
    
    const processNextBatch = () => {
      const batch = items.slice(index, index + batchSize);
      if (batch.length === 0) {
        resolve();
        return;
      }
      
      processor(batch);
      index += batchSize;
      
      if (onProgress) {
        onProgress(Math.min(100, Math.round((index / items.length) * 100)));
      }
      
      // Use setTimeout to prevent blocking the UI
      setTimeout(processNextBatch, 0);
    };
    
    processNextBatch();
  });
};

const formatExcelDate = (serial: number): string => {
  // Excel dates are number of days since 1900-01-01
  // Convert to JavaScript Date and then to YYYY-MM-DD
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
};

const normalizeDateString = (dateStr: string): string => {
  // Handle various date formats
  if (typeof dateStr === 'number') {
    return formatExcelDate(dateStr);
  }

  // Handle MM/DD/YY format
  const mmddyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
  if (mmddyyRegex.test(dateStr)) {
    const [, month, day, year] = mmddyyRegex.exec(dateStr)!;
    const fullYear = parseInt(year) < 50 ? `20${year}` : `19${year}`;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format. Expected YYYY-MM-DD, got '${dateStr}'`);
  }
  return date.toISOString().split('T')[0];
};

const readFileAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
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
        effectiveDate: earliestNexusDate,
        annualData: {}
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

// Add missing type definition
interface StateSales {
  [stateCode: string]: {
    annualSales: {
      [year: string]: {
        totalRevenue: number;
        transactionCount: number;
        monthlyRevenue: MonthlyRevenue[];
        firstTransactionDate: string;
      };
    };
    totalRevenue: number;
    transactionCount: number;
    monthlyRevenue: MonthlyRevenue[];
  };
}