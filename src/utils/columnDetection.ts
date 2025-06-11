// Enhanced column detection with fuzzy matching and confidence scoring

export interface ColumnMapping {
  [standardName: string]: string[];
}

export interface DetectionResult {
  mapping: { [standardName: string]: string | null };
  confidence: { [standardName: string]: number };
  unmappedHeaders: string[];
  suggestions: { [standardName: string]: string[] };
}

// Comprehensive column variations mapping
export const COLUMN_MAPPINGS: ColumnMapping = {
  date: [
    'date',
    'transaction_date',
    'transaction date',
    'sale_date',
    'sale date',
    'order_date',
    'order date',
    'invoice_date',
    'invoice date',
    'created_date',
    'created date',
    'timestamp',
    'time',
    'when',
    'datetime',
    'date_time',
    'purchase_date',
    'purchase date',
    'billing_date',
    'billing date'
  ],
  state: [
    'state',
    'state_code',
    'state code',
    'st',
    'province',
    'region',
    'ship_to_state',
    'ship to state',
    'shipping_state',
    'shipping state',
    'bill_to_state',
    'bill to state',
    'billing_state',
    'billing state',
    'customer_state',
    'customer state',
    'destination_state',
    'destination state',
    'delivery_state',
    'delivery state'
  ],
  sale_amount: [
    'sale_amount',
    'sale amount',
    'amount',
    'total',
    'total_amount',
    'total amount',
    'revenue',
    'sales',
    'gross_amount',
    'gross amount',
    'net_amount',
    'net amount',
    'price',
    'value',
    'invoice_amount',
    'invoice amount',
    'order_total',
    'order total',
    'subtotal',
    'sub_total',
    'sub total',
    'line_total',
    'line total',
    'extended_price',
    'extended price'
  ],
  transaction_count: [
    'transaction_count',
    'transaction count',
    'transactions',
    'count',
    'quantity',
    'qty',
    'units',
    'items',
    'line_items',
    'line items',
    'order_count',
    'order count',
    'invoice_count',
    'invoice count',
    'sales_count',
    'sales count'
  ],
  customer_address: [
    'customer_address',
    'customer address',
    'address',
    'billing_address',
    'billing address',
    'shipping_address',
    'shipping address',
    'street_address',
    'street address',
    'full_address',
    'full address',
    'location',
    'ship_to_address',
    'ship to address',
    'bill_to_address',
    'bill to address'
  ]
};

// Calculate similarity score between header and target variation
export const calculateSimilarity = (header: string, target: string): number => {
  const normalizedHeader = header.toLowerCase().trim();
  const normalizedTarget = target.toLowerCase().trim();
  
  // Exact match gets highest score
  if (normalizedHeader === normalizedTarget) {
    return 100;
  }
  
  // Remove common separators and try again
  const cleanHeader = normalizedHeader.replace(/[_\-\s]+/g, '');
  const cleanTarget = normalizedTarget.replace(/[_\-\s]+/g, '');
  
  if (cleanHeader === cleanTarget) {
    return 95;
  }
  
  // Check if header contains target as whole word
  const headerWords = normalizedHeader.split(/[_\-\s]+/);
  const targetWords = normalizedTarget.split(/[_\-\s]+/);
  
  // All target words found in header
  if (targetWords.every(word => headerWords.includes(word))) {
    return 90;
  }
  
  // Partial word matching
  let matchingChars = 0;
  const maxLength = Math.max(normalizedHeader.length, normalizedTarget.length);
  
  for (let i = 0; i < Math.min(normalizedHeader.length, normalizedTarget.length); i++) {
    if (normalizedHeader[i] === normalizedTarget[i]) {
      matchingChars++;
    }
  }
  
  // Substring matching bonus
  if (normalizedHeader.includes(normalizedTarget) || normalizedTarget.includes(normalizedHeader)) {
    return Math.max(70, (matchingChars / maxLength) * 100 + 20);
  }
  
  // Basic character similarity
  return (matchingChars / maxLength) * 100;
};

// Detect columns with confidence scoring
export const detectColumns = (rawHeaders: string[]): DetectionResult => {
  const mapping: { [standardName: string]: string | null } = {};
  const confidence: { [standardName: string]: number } = {};
  const suggestions: { [standardName: string]: string[] } = {};
  const usedHeaders = new Set<string>();
  
  // For each standard column, find the best match
  for (const [standardName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    let bestMatch: string | null = null;
    let bestScore = 0;
    const candidateScores: Array<{ header: string; score: number }> = [];
    
    // Test each raw header against all variations for this standard column
    for (const rawHeader of rawHeaders) {
      if (usedHeaders.has(rawHeader)) continue;
      
      let maxScore = 0;
      
      // Test against all variations
      for (const variation of variations) {
        const score = calculateSimilarity(rawHeader, variation);
        maxScore = Math.max(maxScore, score);
      }
      
      candidateScores.push({ header: rawHeader, score: maxScore });
      
      if (maxScore > bestScore) {
        bestScore = maxScore;
        bestMatch = rawHeader;
      }
    }
    
    // Only accept matches with reasonable confidence (>= 60)
    if (bestMatch && bestScore >= 60) {
      mapping[standardName] = bestMatch;
      confidence[standardName] = bestScore;
      usedHeaders.add(bestMatch);
    } else {
      mapping[standardName] = null;
      confidence[standardName] = 0;
    }
    
    // Store top 3 suggestions for this column
    suggestions[standardName] = candidateScores
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .filter(candidate => candidate.score >= 30)
      .map(candidate => candidate.header);
  }
  
  // Find unmapped headers
  const unmappedHeaders = rawHeaders.filter(header => !usedHeaders.has(header));
  
  return {
    mapping,
    confidence,
    unmappedHeaders,
    suggestions
  };
};

// Generate user-friendly detection report
export const generateDetectionReport = (result: DetectionResult): string => {
  const { mapping, confidence, unmappedHeaders, suggestions } = result;
  
  let report = 'Column Detection Results:\n\n';
  
  // Required columns status
  const requiredColumns = ['date', 'state', 'sale_amount'];
  const missingRequired = requiredColumns.filter(col => !mapping[col]);
  
  if (missingRequired.length === 0) {
    report += '✅ All required columns detected successfully!\n\n';
  } else {
    report += `❌ Missing required columns: ${missingRequired.join(', ')}\n\n`;
  }
  
  // Detected mappings
  report += 'Detected Column Mappings:\n';
  for (const [standardName, detectedHeader] of Object.entries(mapping)) {
    if (detectedHeader) {
      const conf = confidence[standardName];
      const confLevel = conf >= 90 ? 'High' : conf >= 70 ? 'Medium' : 'Low';
      report += `  ${standardName} → "${detectedHeader}" (${confLevel} confidence: ${conf.toFixed(1)}%)\n`;
    } else {
      report += `  ${standardName} → Not found\n`;
      if (suggestions[standardName].length > 0) {
        report += `    Suggestions: ${suggestions[standardName].map(s => `"${s}"`).join(', ')}\n`;
      }
    }
  }
  
  // Unmapped headers
  if (unmappedHeaders.length > 0) {
    report += `\nUnmapped columns: ${unmappedHeaders.map(h => `"${h}"`).join(', ')}\n`;
  }
  
  return report;
};

// Validate detection results
export const validateDetection = (result: DetectionResult): { isValid: boolean; errors: string[] } => {
  const { mapping } = result;
  const errors: string[] = [];
  
  // Check required columns
  const requiredColumns = ['date', 'state', 'sale_amount'];
  for (const required of requiredColumns) {
    if (!mapping[required]) {
      errors.push(`Required column '${required}' could not be detected`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Transform data using detected column mapping
export const transformDataWithMapping = (
  data: any[],
  mapping: { [standardName: string]: string | null }
): any[] => {
  return data.map(row => {
    const transformedRow: any = {};
    
    // Map detected columns to standard names
    for (const [standardName, detectedHeader] of Object.entries(mapping)) {
      if (detectedHeader && row[detectedHeader] !== undefined) {
        transformedRow[standardName] = row[detectedHeader];
      }
    }
    
    // Preserve any unmapped columns
    for (const [key, value] of Object.entries(row)) {
      if (!Object.values(mapping).includes(key)) {
        transformedRow[key] = value;
      }
    }
    
    return transformedRow;
  });
};