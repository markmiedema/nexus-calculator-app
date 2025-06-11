import { CSVRow, ProcessedCSVRow, SalesDataRow } from '../types';
import { APP_CONFIG, VALIDATION_CONFIG } from '../config';
import { DetectionResult, detectColumns, validateDetection, generateDetectionReport } from './columnDetection';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  detectionResult?: DetectionResult;
  suggestions: string[];
}

export interface ColumnMappingPreview {
  detectedMappings: Array<{
    standardColumn: string;
    detectedHeader: string | null;
    confidence: number;
    isRequired: boolean;
    status: 'detected' | 'missing' | 'low_confidence';
  }>;
  unmappedHeaders: string[];
  overallConfidence: number;
  canProceed: boolean;
}

// Enhanced CSV validation with smart detection
export const validateCSVWithSmartDetection = (data: CSVRow[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Basic data checks
  if (data.length === 0) {
    return {
      isValid: false,
      errors: ['CSV file is empty. Please upload a file with sales data.'],
      warnings: [],
      suggestions: [
        'Download our CSV template to see the expected format',
        'Ensure your file contains at least one row of data plus headers'
      ]
    };
  }

  if (data.length === 1) {
    return {
      isValid: false,
      errors: ['CSV file contains only headers with no data rows.'],
      warnings: [],
      suggestions: [
        'Add at least one row of sales data to your CSV file',
        'Check that your data wasn\'t accidentally filtered out'
      ]
    };
  }

  // Extract headers and run smart detection
  const rawHeaders = Object.keys(data[0]);
  const detectionResult = detectColumns(rawHeaders);
  const validationResult = validateDetection(detectionResult);

  // Check if required columns were detected
  if (!validationResult.isValid) {
    errors.push(...validationResult.errors);
    
    // Add specific suggestions for missing columns
    const requiredColumns = ['date', 'state', 'sale_amount'];
    for (const column of requiredColumns) {
      if (!detectionResult.mapping[column]) {
        const columnSuggestions = detectionResult.suggestions[column];
        if (columnSuggestions.length > 0) {
          suggestions.push(
            `For '${column}' column, consider renaming one of these headers: ${columnSuggestions.map(s => `"${s}"`).join(', ')}`
          );
        } else {
          suggestions.push(
            `Add a '${column}' column to your CSV file. Common variations include: ${getColumnVariations(column).slice(0, 3).join(', ')}`
          );
        }
      }
    }
  }

  // Check confidence levels and add warnings
  for (const [column, confidence] of Object.entries(detectionResult.confidence)) {
    if (detectionResult.mapping[column] && confidence < 80) {
      warnings.push(
        `Low confidence match for '${column}' column (${confidence.toFixed(1)}%). ` +
        `Detected as "${detectionResult.mapping[column]}" - please verify this is correct.`
      );
    }
  }

  // Validate data quality in detected columns
  if (validationResult.isValid) {
    const dataQualityResult = validateDataQuality(data, detectionResult);
    errors.push(...dataQualityResult.errors);
    warnings.push(...dataQualityResult.warnings);
    suggestions.push(...dataQualityResult.suggestions);
  }

  // Add general suggestions
  if (detectionResult.unmappedHeaders.length > 0) {
    suggestions.push(
      `Unmapped columns detected: ${detectionResult.unmappedHeaders.map(h => `"${h}"`).join(', ')}. ` +
      'These will be preserved but not used in the analysis.'
    );
  }

  return {
    isValid: validationResult.isValid && errors.length === 0,
    errors,
    warnings,
    detectionResult,
    suggestions
  };
};

// Validate data quality in detected columns
const validateDataQuality = (data: CSVRow[], detectionResult: DetectionResult): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  const { mapping } = detectionResult;
  const sampleSize = Math.min(100, data.length); // Check first 100 rows for performance

  // Validate date column
  if (mapping.date) {
    const dateHeader = mapping.date;
    let invalidDates = 0;
    let emptyDates = 0;

    for (let i = 0; i < sampleSize; i++) {
      const dateValue = data[i][dateHeader];
      
      if (!dateValue || dateValue.toString().trim() === '') {
        emptyDates++;
      } else {
        const dateStr = dateValue.toString().trim();
        if (!isValidDateFormat(dateStr)) {
          invalidDates++;
        }
      }
    }

    if (emptyDates > 0) {
      errors.push(`Found ${emptyDates} empty date values in the first ${sampleSize} rows.`);
      suggestions.push('Ensure all rows have valid dates in YYYY-MM-DD format');
    }

    if (invalidDates > 0) {
      warnings.push(`Found ${invalidDates} potentially invalid date formats in the first ${sampleSize} rows.`);
      suggestions.push('Supported date formats: YYYY-MM-DD, MM/DD/YYYY, MM/DD/YY');
    }
  }

  // Validate state column
  if (mapping.state) {
    const stateHeader = mapping.state;
    let invalidStates = 0;
    let emptyStates = 0;

    for (let i = 0; i < sampleSize; i++) {
      const stateValue = data[i][stateHeader];
      
      if (!stateValue || stateValue.toString().trim() === '') {
        emptyStates++;
      } else {
        const stateStr = stateValue.toString().trim().toUpperCase();
        if (!VALIDATION_CONFIG.stateCodePattern.test(stateStr) && !isValidStateName(stateStr)) {
          invalidStates++;
        }
      }
    }

    if (emptyStates > 0) {
      errors.push(`Found ${emptyStates} empty state values in the first ${sampleSize} rows.`);
      suggestions.push('Ensure all rows have valid state codes (e.g., CA, NY) or state names');
    }

    if (invalidStates > 0) {
      warnings.push(`Found ${invalidStates} potentially invalid state values in the first ${sampleSize} rows.`);
      suggestions.push('Use 2-letter state codes (CA, NY, TX) or full state names (California, New York, Texas)');
    }
  }

  // Validate sale amount column
  if (mapping.sale_amount) {
    const amountHeader = mapping.sale_amount;
    let invalidAmounts = 0;
    let emptyAmounts = 0;
    let negativeAmounts = 0;

    for (let i = 0; i < sampleSize; i++) {
      const amountValue = data[i][amountHeader];
      
      if (!amountValue || amountValue.toString().trim() === '') {
        emptyAmounts++;
      } else {
        const cleanAmount = cleanCurrencyValue(amountValue.toString());
        const numericAmount = parseFloat(cleanAmount);
        
        if (isNaN(numericAmount)) {
          invalidAmounts++;
        } else if (numericAmount < 0) {
          negativeAmounts++;
        }
      }
    }

    if (emptyAmounts > 0) {
      errors.push(`Found ${emptyAmounts} empty sale amount values in the first ${sampleSize} rows.`);
      suggestions.push('Ensure all rows have valid numeric sale amounts');
    }

    if (invalidAmounts > 0) {
      warnings.push(`Found ${invalidAmounts} non-numeric sale amounts in the first ${sampleSize} rows.`);
      suggestions.push('Sale amounts should be numeric values (e.g., 1000.50, $1,000.50)');
    }

    if (negativeAmounts > 0) {
      warnings.push(`Found ${negativeAmounts} negative sale amounts in the first ${sampleSize} rows.`);
      suggestions.push('Negative amounts may indicate returns or refunds - verify this is intentional');
    }
  }

  return { isValid: errors.length === 0, errors, warnings, suggestions };
};

// Generate column mapping preview for user interface
export const generateColumnMappingPreview = (detectionResult: DetectionResult): ColumnMappingPreview => {
  const { mapping, confidence } = detectionResult;
  const requiredColumns = ['date', 'state', 'sale_amount'];
  
  const detectedMappings = Object.entries(mapping).map(([standardColumn, detectedHeader]) => {
    const isRequired = requiredColumns.includes(standardColumn);
    const conf = confidence[standardColumn] || 0;
    
    let status: 'detected' | 'missing' | 'low_confidence';
    if (!detectedHeader) {
      status = 'missing';
    } else if (conf < 70) {
      status = 'low_confidence';
    } else {
      status = 'detected';
    }

    return {
      standardColumn,
      detectedHeader,
      confidence: conf,
      isRequired,
      status
    };
  });

  // Calculate overall confidence
  const detectedColumns = detectedMappings.filter(m => m.detectedHeader);
  const overallConfidence = detectedColumns.length > 0 
    ? detectedColumns.reduce((sum, m) => sum + m.confidence, 0) / detectedColumns.length
    : 0;

  // Check if we can proceed
  const missingRequired = detectedMappings.filter(m => m.isRequired && m.status === 'missing');
  const canProceed = missingRequired.length === 0;

  return {
    detectedMappings,
    unmappedHeaders: detectionResult.unmappedHeaders,
    overallConfidence,
    canProceed
  };
};

// Generate CSV template for download
export const generateCSVTemplate = (): string => {
  const headers = ['date', 'state', 'sale_amount', 'transaction_count', 'customer_address'];
  const sampleData = [
    ['2024-01-15', 'CA', '1500.00', '1', '123 Main St, Los Angeles, CA'],
    ['2024-01-16', 'TX', '2500.00', '2', '456 Oak Ave, Houston, TX'],
    ['2024-01-17', 'NY', '3000.00', '1', '789 Pine St, New York, NY'],
    ['2024-01-18', 'FL', '1200.00', '1', '321 Beach Blvd, Miami, FL'],
    ['2024-01-19', 'WA', '1800.00', '3', '654 Cedar Ln, Seattle, WA']
  ];

  const csvContent = [
    headers.join(','),
    ...sampleData.map(row => row.join(','))
  ].join('\n');

  return csvContent;
};

// Create and download CSV template file
export const downloadCSVTemplate = (): void => {
  const csvContent = generateCSVTemplate();
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'salt_nexus_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Helper functions
const isValidDateFormat = (dateStr: string): boolean => {
  // Support multiple date formats
  const formats = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{1,2}\/\d{1,2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{1,2}\/\d{1,2}\/\d{2}$/, // MM/DD/YY
    /^\d{1,2}-\d{1,2}-\d{4}$/, // MM-DD-YYYY
    /^\d{1,2}-\d{1,2}-\d{2}$/ // MM-DD-YY
  ];

  if (!formats.some(format => format.test(dateStr))) {
    return false;
  }

  // Try to parse the date
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
};

const isValidStateName = (stateName: string): boolean => {
  const stateNames = [
    'ALABAMA', 'ALASKA', 'ARIZONA', 'ARKANSAS', 'CALIFORNIA', 'COLORADO',
    'CONNECTICUT', 'DELAWARE', 'FLORIDA', 'GEORGIA', 'HAWAII', 'IDAHO',
    'ILLINOIS', 'INDIANA', 'IOWA', 'KANSAS', 'KENTUCKY', 'LOUISIANA',
    'MAINE', 'MARYLAND', 'MASSACHUSETTS', 'MICHIGAN', 'MINNESOTA',
    'MISSISSIPPI', 'MISSOURI', 'MONTANA', 'NEBRASKA', 'NEVADA',
    'NEW HAMPSHIRE', 'NEW JERSEY', 'NEW MEXICO', 'NEW YORK',
    'NORTH CAROLINA', 'NORTH DAKOTA', 'OHIO', 'OKLAHOMA', 'OREGON',
    'PENNSYLVANIA', 'RHODE ISLAND', 'SOUTH CAROLINA', 'SOUTH DAKOTA',
    'TENNESSEE', 'TEXAS', 'UTAH', 'VERMONT', 'VIRGINIA', 'WASHINGTON',
    'WEST VIRGINIA', 'WISCONSIN', 'WYOMING', 'DISTRICT OF COLUMBIA'
  ];
  
  return stateNames.includes(stateName.toUpperCase());
};

const cleanCurrencyValue = (value: string): string => {
  // Remove currency symbols, commas, and parentheses
  return value.replace(/[$,()]/g, '').trim();
};

const getColumnVariations = (standardColumn: string): string[] => {
  const variations: { [key: string]: string[] } = {
    date: ['date', 'transaction_date', 'sale_date', 'order_date'],
    state: ['state', 'state_code', 'ship_to_state', 'billing_state'],
    sale_amount: ['sale_amount', 'amount', 'total', 'revenue', 'price'],
    transaction_count: ['transaction_count', 'quantity', 'qty', 'count'],
    customer_address: ['customer_address', 'address', 'billing_address', 'shipping_address']
  };
  
  return variations[standardColumn] || [];
};

// Legacy validation function for backward compatibility
export const validateCSV = (data: CSVRow[]): void => {
  const result = validateCSVWithSmartDetection(data);
  
  if (!result.isValid) {
    const errorMessage = result.errors.join('\n');
    throw new Error(errorMessage);
  }
};

export const validateDateRange = (data: SalesDataRow[]): void => {
  // Get all unique dates
  const dates = data.map(row => new Date(row.date));
  
  // Find min and max dates
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
  
  // Calculate year difference
  const yearDiff = maxDate.getFullYear() - minDate.getFullYear();
  
  if (yearDiff > VALIDATION_CONFIG.maxYearSpan) {
    throw new Error(`Data spans more than ${VALIDATION_CONFIG.maxYearSpan} years. Please provide data for 1-${VALIDATION_CONFIG.maxYearSpan} years only.`);
  }
};

export const validateFileSize = (file: File): void => {
  if (file.size > APP_CONFIG.maxFileSize) {
    throw new Error(`File size exceeds the maximum limit of ${APP_CONFIG.maxFileSize / (1024 * 1024)}MB.`);
  }
};