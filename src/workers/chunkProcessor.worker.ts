// Chunk Processing Web Worker
// Specialized worker for processing individual data chunks

// Re-use the same embedded data and functions from the main worker
const STATE_THRESHOLDS = {
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
  'MT': { revenue: 0, transactions: null },
  'NH': { revenue: 0, transactions: null },
  'OR': { revenue: 0, transactions: null },
  'DE': { revenue: 0, transactions: null }
};

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

// Column mapping for chunk processing
const COLUMN_MAPPINGS = {
  date: [
    'date', 'transaction_date', 'transaction date', 'sale_date', 'sale date',
    'order_date', 'order date', 'invoice_date', 'invoice date'
  ],
  state: [
    'state', 'state_code', 'state code', 'st', 'province', 'region',
    'ship_to_state', 'ship to state', 'shipping_state', 'shipping state'
  ],
  sale_amount: [
    'sale_amount', 'sale amount', 'amount', 'total', 'total_amount',
    'revenue', 'sales', 'price', 'value', 'sales amount ($)'
  ],
  transaction_count: [
    'transaction_count', 'transaction count', 'quantity', 'qty', 'units'
  ],
  city: ['city', 'customer_city', 'billing_city', 'shipping_city'],
  county: ['county', 'customer_county', 'billing_county', 'parish'],
  zip_code: ['zip_code', 'zip', 'postal_code', 'zipcode']
};

// Worker message interface
interface ChunkWorkerMessage {
  type: 'PROCESS_CHUNK' | 'PROGRESS' | 'SUCCESS' | 'ERROR';
  payload?: any;
  progress?: number;
  error?: string;
  chunkIndex?: number;
}

// Data cleaning functions (simplified for chunk processing)
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
  
  return null;
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

// Detect columns for chunk (assumes consistent structure)
const detectColumnsForChunk = (sampleRow: any) => {
  const headers = Object.keys(sampleRow);
  const mapping: { [key: string]: string | null } = {};
  
  // Simple detection for chunk processing
  for (const header of headers) {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader.includes('date')) {
      mapping.date = header;
    } else if (lowerHeader.includes('state')) {
      mapping.state = header;
    } else if (lowerHeader.includes('amount') || lowerHeader.includes('total') || lowerHeader.includes('sales')) {
      mapping.sale_amount = header;
    } else if (lowerHeader.includes('count') || lowerHeader.includes('qty') || lowerHeader.includes('quantity')) {
      mapping.transaction_count = header;
    } else if (lowerHeader.includes('city')) {
      mapping.city = header;
    } else if (lowerHeader.includes('county')) {
      mapping.county = header;
    } else if (lowerHeader.includes('zip')) {
      mapping.zip_code = header;
    }
  }
  
  return mapping;
};

// Process a single data row
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

// Main chunk processing function
const processChunk = async (
  chunkData: any[],
  onProgress: (progress: number) => void
): Promise<{
  cleanedData: any[];
  stats: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    processingTime: number;
  };
}> => {
  const startTime = Date.now();
  
  if (chunkData.length === 0) {
    return {
      cleanedData: [],
      stats: {
        totalRows: 0,
        validRows: 0,
        invalidRows: 0,
        processingTime: 0
      }
    };
  }
  
  onProgress(10);
  
  // Detect column mapping from first row
  const mapping = detectColumnsForChunk(chunkData[0]);
  
  onProgress(20);
  
  // Process rows in mini-batches for progress reporting
  const cleanedData: any[] = [];
  const miniBatchSize = Math.max(10, Math.floor(chunkData.length / 10));
  let validRows = 0;
  let invalidRows = 0;
  
  for (let i = 0; i < chunkData.length; i += miniBatchSize) {
    const miniBatch = chunkData.slice(i, i + miniBatchSize);
    
    for (const row of miniBatch) {
      try {
        const cleanedRow = processDataRow(row, mapping);
        
        // Validate required fields
        if (cleanedRow.date && cleanedRow.state && cleanedRow.sale_amount !== null) {
          cleanedData.push(cleanedRow);
          validRows++;
        } else {
          invalidRows++;
        }
      } catch (error) {
        invalidRows++;
      }
    }
    
    // Report progress
    const progress = 20 + Math.floor(((i + miniBatchSize) / chunkData.length) * 70);
    onProgress(Math.min(90, progress));
    
    // Yield control
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  onProgress(100);
  
  const processingTime = Date.now() - startTime;
  
  return {
    cleanedData,
    stats: {
      totalRows: chunkData.length,
      validRows,
      invalidRows,
      processingTime
    }
  };
};

// Worker message handler
self.onmessage = async (event: MessageEvent<ChunkWorkerMessage>) => {
  const { type, payload, chunkIndex } = event.data;
  
  try {
    switch (type) {
      case 'PROCESS_CHUNK':
        const result = await processChunk(payload, (progress: number) => {
          self.postMessage({
            type: 'PROGRESS',
            progress,
            chunkIndex
          } as ChunkWorkerMessage);
        });
        
        self.postMessage({
          type: 'SUCCESS',
          payload: result,
          chunkIndex
        } as ChunkWorkerMessage);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      chunkIndex
    } as ChunkWorkerMessage);
  }
};

// Export for TypeScript (won't be used in worker context)
export {};