// Enhanced data cleaning utilities for SALT Nexus Calculator

export interface CleaningResult {
  cleanedValue: any;
  originalValue: any;
  wasModified: boolean;
  warnings: string[];
}

export interface DataCleaningReport {
  totalRows: number;
  cleanedRows: number;
  warnings: string[];
  errors: string[];
  modifications: {
    currencySymbolsRemoved: number;
    negativeParenthesesConverted: number;
    stateNamesConverted: number;
    dateFormatsNormalized: number;
    invalidValuesSkipped: number;
  };
}

// State name to code mapping
const STATE_NAME_TO_CODE: Record<string, string> = {
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

// Valid state codes for validation
const VALID_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]);

/**
 * Clean currency values by removing symbols and handling negative amounts
 */
export const cleanCurrencyValue = (value: any): CleaningResult => {
  const originalValue = value;
  const warnings: string[] = [];
  let cleanedValue = value;
  let wasModified = false;

  if (value === null || value === undefined || value === '') {
    return { cleanedValue: null, originalValue, wasModified: false, warnings: [] };
  }

  // Convert to string for processing
  let stringValue = String(value).trim();

  // Handle negative amounts in parentheses (e.g., "(1000)" -> "-1000")
  const parenthesesMatch = stringValue.match(/^\(([^)]+)\)$/);
  if (parenthesesMatch) {
    stringValue = '-' + parenthesesMatch[1];
    wasModified = true;
  }

  // Remove currency symbols and formatting
  const originalString = stringValue;
  stringValue = stringValue.replace(/[$£€¥₹₽¢]/g, ''); // Currency symbols
  stringValue = stringValue.replace(/[,\s]/g, ''); // Commas and spaces
  stringValue = stringValue.replace(/['"]/g, ''); // Quotes

  if (stringValue !== originalString) {
    wasModified = true;
  }

  // Try to parse as number
  const numericValue = parseFloat(stringValue);
  
  if (isNaN(numericValue)) {
    warnings.push(`Could not convert "${originalValue}" to a valid number`);
    cleanedValue = null;
  } else {
    cleanedValue = numericValue;
    
    // Add warnings for unusual values
    if (numericValue < 0) {
      warnings.push(`Negative amount detected: ${numericValue}`);
    }
    if (numericValue > 1000000) {
      warnings.push(`Large amount detected: ${numericValue.toLocaleString()}`);
    }
  }

  return { cleanedValue, originalValue, wasModified, warnings };
};

/**
 * Clean and normalize date values
 */
export const cleanDateValue = (value: any): CleaningResult => {
  const originalValue = value;
  const warnings: string[] = [];
  let cleanedValue = value;
  let wasModified = false;

  if (value === null || value === undefined || value === '') {
    return { cleanedValue: null, originalValue, wasModified: false, warnings: [] };
  }

  // Handle Excel serial dates (numbers)
  if (typeof value === 'number') {
    try {
      // Excel dates are number of days since 1900-01-01
      const date = new Date(Math.round((value - 25569) * 86400 * 1000));
      cleanedValue = date.toISOString().split('T')[0];
      wasModified = true;
    } catch (error) {
      warnings.push(`Could not convert Excel date serial ${value}`);
      cleanedValue = null;
    }
    return { cleanedValue, originalValue, wasModified, warnings };
  }

  let stringValue = String(value).trim();

  // Handle various date formats
  const dateFormats = [
    // MM/DD/YYYY or MM/DD/YY
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/,
      converter: (match: RegExpMatchArray) => {
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        let year = match[3];
        
        // Handle 2-digit years
        if (year.length === 2) {
          const yearNum = parseInt(year);
          year = yearNum < 50 ? `20${year}` : `19${year}`;
        }
        
        return `${year}-${month}-${day}`;
      }
    },
    // MM-DD-YYYY or MM-DD-YY
    {
      regex: /^(\d{1,2})-(\d{1,2})-(\d{2,4})$/,
      converter: (match: RegExpMatchArray) => {
        const month = match[1].padStart(2, '0');
        const day = match[2].padStart(2, '0');
        let year = match[3];
        
        if (year.length === 2) {
          const yearNum = parseInt(year);
          year = yearNum < 50 ? `20${year}` : `19${year}`;
        }
        
        return `${year}-${month}-${day}`;
      }
    },
    // DD/MM/YYYY (European format)
    {
      regex: /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
      converter: (match: RegExpMatchArray) => {
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        
        // Validate day/month ranges to detect format
        const dayNum = parseInt(day);
        const monthNum = parseInt(month);
        
        if (dayNum > 12 && monthNum <= 12) {
          // Definitely DD/MM/YYYY
          return `${year}-${month}-${day}`;
        } else if (monthNum > 12 && dayNum <= 12) {
          // Definitely MM/DD/YYYY
          return `${year}-${day}-${month}`;
        } else {
          // Ambiguous - assume MM/DD/YYYY (US format)
          return `${year}-${month}-${day}`;
        }
      }
    }
  ];

  // Try to match and convert date formats
  for (const format of dateFormats) {
    const match = stringValue.match(format.regex);
    if (match) {
      try {
        const convertedDate = format.converter(match);
        const date = new Date(convertedDate);
        
        if (!isNaN(date.getTime())) {
          cleanedValue = convertedDate;
          wasModified = stringValue !== convertedDate;
          
          // Validate date range
          const year = date.getFullYear();
          if (year < 2000 || year > 2030) {
            warnings.push(`Date year ${year} seems unusual`);
          }
          
          return { cleanedValue, originalValue, wasModified, warnings };
        }
      } catch (error) {
        // Continue to next format
      }
    }
  }

  // Try parsing as-is
  try {
    const date = new Date(stringValue);
    if (!isNaN(date.getTime())) {
      cleanedValue = date.toISOString().split('T')[0];
      wasModified = stringValue !== cleanedValue;
    } else {
      warnings.push(`Could not parse date: "${originalValue}"`);
      cleanedValue = null;
    }
  } catch (error) {
    warnings.push(`Invalid date format: "${originalValue}"`);
    cleanedValue = null;
  }

  return { cleanedValue, originalValue, wasModified, warnings };
};

/**
 * Clean and normalize state values (convert names to codes)
 */
export const cleanStateValue = (value: any): CleaningResult => {
  const originalValue = value;
  const warnings: string[] = [];
  let cleanedValue = value;
  let wasModified = false;

  if (value === null || value === undefined || value === '') {
    return { cleanedValue: null, originalValue, wasModified: false, warnings: [] };
  }

  let stringValue = String(value).trim().toUpperCase();

  // Check if it's already a valid state code
  if (VALID_STATE_CODES.has(stringValue)) {
    cleanedValue = stringValue;
    wasModified = stringValue !== String(originalValue).trim();
    return { cleanedValue, originalValue, wasModified, warnings };
  }

  // Try to convert state name to code
  if (STATE_NAME_TO_CODE[stringValue]) {
    cleanedValue = STATE_NAME_TO_CODE[stringValue];
    wasModified = true;
    return { cleanedValue, originalValue, wasModified, warnings };
  }

  // Try partial matching for common abbreviations or typos
  const partialMatches = Object.keys(STATE_NAME_TO_CODE).filter(name => 
    name.includes(stringValue) || stringValue.includes(name.substring(0, 4))
  );

  if (partialMatches.length === 1) {
    cleanedValue = STATE_NAME_TO_CODE[partialMatches[0]];
    wasModified = true;
    warnings.push(`Partial match: "${originalValue}" -> "${cleanedValue}"`);
    return { cleanedValue, originalValue, wasModified, warnings };
  }

  // Check for common typos or variations
  const commonVariations: Record<string, string> = {
    'CALIF': 'CA',
    'CALIFORNIA': 'CA',
    'FLA': 'FL',
    'FLORIDA': 'FL',
    'TEX': 'TX',
    'TEXAS': 'TX',
    'NY': 'NY',
    'NYC': 'NY',
    'LA': 'LA', // Could be Louisiana or Los Angeles - context needed
    'MASS': 'MA',
    'PENN': 'PA',
    'WASH': 'WA',
    'MICH': 'MI',
    'ILL': 'IL',
    'CONN': 'CT',
    'WISC': 'WI',
    'MINN': 'MN',
    'TENN': 'TN',
    'MISS': 'MS',
    'ALA': 'AL',
    'ARIZ': 'AZ',
    'ARK': 'AR',
    'COLO': 'CO',
    'DEL': 'DE',
    'GA': 'GA',
    'IDA': 'ID',
    'IND': 'IN',
    'KAN': 'KS',
    'KY': 'KY',
    'ME': 'ME',
    'MD': 'MD',
    'MONT': 'MT',
    'NEB': 'NE',
    'NEV': 'NV',
    'NH': 'NH',
    'NJ': 'NJ',
    'NM': 'NM',
    'NC': 'NC',
    'ND': 'ND',
    'OHIO': 'OH',
    'OKLA': 'OK',
    'ORE': 'OR',
    'RI': 'RI',
    'SC': 'SC',
    'SD': 'SD',
    'UTAH': 'UT',
    'VT': 'VT',
    'VA': 'VA',
    'WV': 'WV',
    'WYO': 'WY'
  };

  if (commonVariations[stringValue]) {
    cleanedValue = commonVariations[stringValue];
    wasModified = true;
    return { cleanedValue, originalValue, wasModified, warnings };
  }

  // If no match found, return null with warning
  warnings.push(`Unrecognized state: "${originalValue}"`);
  cleanedValue = null;

  return { cleanedValue, originalValue, wasModified, warnings };
};

/**
 * Clean integer values (like transaction count)
 */
export const cleanIntegerValue = (value: any): CleaningResult => {
  const originalValue = value;
  const warnings: string[] = [];
  let cleanedValue = value;
  let wasModified = false;

  if (value === null || value === undefined || value === '') {
    return { cleanedValue: 1, originalValue, wasModified: true, warnings: ['Empty transaction count defaulted to 1'] };
  }

  // Convert to string and clean
  let stringValue = String(value).trim();
  
  // Remove commas and spaces
  stringValue = stringValue.replace(/[,\s]/g, '');
  
  if (stringValue !== String(originalValue).trim()) {
    wasModified = true;
  }

  // Try to parse as integer
  const intValue = parseInt(stringValue);
  
  if (isNaN(intValue)) {
    warnings.push(`Could not convert "${originalValue}" to integer, defaulting to 1`);
    cleanedValue = 1;
    wasModified = true;
  } else {
    cleanedValue = Math.max(1, intValue); // Ensure at least 1
    
    if (intValue <= 0) {
      warnings.push(`Invalid transaction count ${intValue}, set to 1`);
      wasModified = true;
    }
    
    if (intValue > 1000) {
      warnings.push(`Large transaction count: ${intValue}`);
    }
  }

  return { cleanedValue, originalValue, wasModified, warnings };
};

/**
 * Clean text values (like city, county, customer_address)
 */
export const cleanTextValue = (value: any): CleaningResult => {
  const originalValue = value;
  const warnings: string[] = [];
  let cleanedValue = value;
  let wasModified = false;

  if (value === null || value === undefined) {
    return { cleanedValue: null, originalValue, wasModified: false, warnings: [] };
  }

  // Convert to string and trim
  let stringValue = String(value).trim();
  
  // Remove extra whitespace
  const cleanedString = stringValue.replace(/\s+/g, ' ');
  
  if (cleanedString !== stringValue) {
    wasModified = true;
  }

  cleanedValue = cleanedString || null;

  return { cleanedValue, originalValue, wasModified, warnings };
};

/**
 * Clean an entire data row based on detected column mapping
 */
export const cleanDataRow = (
  row: any,
  mapping: { [standardName: string]: string | null }
): { cleanedRow: any; warnings: string[]; wasModified: boolean } => {
  const cleanedRow: any = {};
  const warnings: string[] = [];
  let wasModified = false;

  // Clean mapped columns
  for (const [standardName, detectedHeader] of Object.entries(mapping)) {
    if (!detectedHeader || !(detectedHeader in row)) {
      continue;
    }

    const originalValue = row[detectedHeader];
    let result: CleaningResult;

    switch (standardName) {
      case 'date':
        result = cleanDateValue(originalValue);
        break;
      case 'state':
        result = cleanStateValue(originalValue);
        break;
      case 'sale_amount':
        result = cleanCurrencyValue(originalValue);
        break;
      case 'transaction_count':
        result = cleanIntegerValue(originalValue);
        break;
      case 'city':
      case 'county':
      case 'zip_code':
      case 'customer_address':
        result = cleanTextValue(originalValue);
        break;
      default:
        // For unknown columns, just copy as-is
        result = {
          cleanedValue: originalValue,
          originalValue,
          wasModified: false,
          warnings: []
        };
    }

    cleanedRow[standardName] = result.cleanedValue;
    warnings.push(...result.warnings);
    
    if (result.wasModified) {
      wasModified = true;
    }
  }

  // Copy unmapped columns as-is
  for (const [key, value] of Object.entries(row)) {
    if (!Object.values(mapping).includes(key)) {
      cleanedRow[key] = value;
    }
  }

  return { cleanedRow, warnings, wasModified };
};

/**
 * Clean an entire dataset
 */
export const cleanDataset = (
  data: any[],
  mapping: { [standardName: string]: string | null }
): { cleanedData: any[]; report: DataCleaningReport } => {
  const cleanedData: any[] = [];
  const allWarnings: string[] = [];
  const errors: string[] = [];
  
  const modifications = {
    currencySymbolsRemoved: 0,
    negativeParenthesesConverted: 0,
    stateNamesConverted: 0,
    dateFormatsNormalized: 0,
    invalidValuesSkipped: 0
  };

  let cleanedRows = 0;

  for (let i = 0; i < data.length; i++) {
    try {
      const { cleanedRow, warnings, wasModified } = cleanDataRow(data[i], mapping);
      
      // Check if row has required fields
      const hasRequiredFields = cleanedRow.date && cleanedRow.state && cleanedRow.sale_amount !== null;
      
      if (hasRequiredFields) {
        cleanedData.push(cleanedRow);
        cleanedRows++;
        
        if (wasModified) {
          // Count specific types of modifications
          if (warnings.some(w => w.includes('currency') || w.includes('$'))) {
            modifications.currencySymbolsRemoved++;
          }
          if (warnings.some(w => w.includes('parentheses') || w.includes('('))) {
            modifications.negativeParenthesesConverted++;
          }
          if (warnings.some(w => w.includes('state') && w.includes('->'))) {
            modifications.stateNamesConverted++;
          }
          if (warnings.some(w => w.includes('date') || w.includes('Excel'))) {
            modifications.dateFormatsNormalized++;
          }
        }
      } else {
        modifications.invalidValuesSkipped++;
        errors.push(`Row ${i + 1}: Missing required fields (date: ${!!cleanedRow.date}, state: ${!!cleanedRow.state}, amount: ${cleanedRow.sale_amount !== null})`);
      }
      
      // Add row-specific warnings with row numbers
      warnings.forEach(warning => {
        allWarnings.push(`Row ${i + 1}: ${warning}`);
      });
      
    } catch (error) {
      errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      modifications.invalidValuesSkipped++;
    }
  }

  const report: DataCleaningReport = {
    totalRows: data.length,
    cleanedRows,
    warnings: allWarnings,
    errors,
    modifications
  };

  return { cleanedData, report };
};

/**
 * Generate a summary of data cleaning operations
 */
export const generateCleaningReport = (report: DataCleaningReport): string => {
  const { totalRows, cleanedRows, warnings, errors, modifications } = report;
  
  let summary = `Data Cleaning Report\n`;
  summary += `==================\n\n`;
  summary += `Total rows processed: ${totalRows}\n`;
  summary += `Successfully cleaned: ${cleanedRows}\n`;
  summary += `Rows skipped: ${totalRows - cleanedRows}\n`;
  summary += `Success rate: ${((cleanedRows / totalRows) * 100).toFixed(1)}%\n\n`;
  
  summary += `Modifications Applied:\n`;
  summary += `- Currency symbols removed: ${modifications.currencySymbolsRemoved} rows\n`;
  summary += `- Negative parentheses converted: ${modifications.negativeParenthesesConverted} rows\n`;
  summary += `- State names converted to codes: ${modifications.stateNamesConverted} rows\n`;
  summary += `- Date formats normalized: ${modifications.dateFormatsNormalized} rows\n`;
  summary += `- Invalid values skipped: ${modifications.invalidValuesSkipped} rows\n\n`;
  
  if (warnings.length > 0) {
    summary += `Warnings (${warnings.length}):\n`;
    warnings.slice(0, 10).forEach(warning => {
      summary += `- ${warning}\n`;
    });
    if (warnings.length > 10) {
      summary += `... and ${warnings.length - 10} more warnings\n`;
    }
    summary += `\n`;
  }
  
  if (errors.length > 0) {
    summary += `Errors (${errors.length}):\n`;
    errors.slice(0, 10).forEach(error => {
      summary += `- ${error}\n`;
    });
    if (errors.length > 10) {
      summary += `... and ${errors.length - 10} more errors\n`;
    }
  }
  
  return summary;
};