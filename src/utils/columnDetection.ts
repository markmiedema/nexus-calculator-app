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
    'sales count',
    'number_of_transactions',
    'num_transactions',
    'trans_count',
    'item_count',
    'item count'
  ],
  city: [
    'city',
    'customer_city',
    'customer city',
    'billing_city',
    'billing city',
    'shipping_city',
    'shipping city',
    'ship_to_city',
    'ship to city',
    'bill_to_city',
    'bill to city',
    'destination_city',
    'destination city',
    'delivery_city',
    'delivery city',
    'town',
    'municipality',
    'locality'
  ],
  county: [
    'county',
    'customer_county',
    'customer county',
    'billing_county',
    'billing county',
    'shipping_county',
    'shipping county',
    'ship_to_county',
    'ship to county',
    'bill_to_county',
    'bill to county',
    'destination_county',
    'destination county',
    'delivery_county',
    'delivery county',
    'parish',
    'borough'
  ],
  zip_code: [
    'zip_code',
    'zip code',
    'zip',
    'postal_code',
    'postal code',
    'postcode',
    'zipcode',
    'customer_zip',
    'customer zip',
    'billing_zip',
    'billing zip',
    'shipping_zip',
    'shipping zip',
    'ship_to_zip',
    'ship to zip',
    'bill_to_zip',
    'bill to zip',
    'destination_zip',
    'destination zip',
    'delivery_zip',
    'delivery zip'
  ]
};

// Enhanced similarity calculation with better word boundary detection
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
  
  // CRITICAL FIX: Prevent "county" from matching "count" by checking word boundaries
  // If target is a substring but not a complete word, reduce score significantly
  if (normalizedTarget.length >= 4) { // Only for meaningful words
    const headerWords = normalizedHeader.split(/[_\-\s]+/);
    const targetWords = normalizedTarget.split(/[_\-\s]+/);
    
    // Check for exact word matches first
    let exactWordMatches = 0;
    let partialWordMatches = 0;
    
    for (const targetWord of targetWords) {
      if (headerWords.includes(targetWord)) {
        exactWordMatches++;
      } else {
        // Check if any header word contains this target word as substring
        const hasPartialMatch = headerWords.some(headerWord => 
          headerWord.includes(targetWord) && headerWord !== targetWord
        );
        if (hasPartialMatch) {
          partialWordMatches++;
        }
      }
    }
    
    // If all target words are exact matches, high score
    if (exactWordMatches === targetWords.length) {
      return 90;
    }
    
    // If we have partial matches but no exact matches, be more cautious
    if (exactWordMatches === 0 && partialWordMatches > 0) {
      // Special case: prevent "county" from matching "count"
      if (targetWords.includes('count') && headerWords.some(w => w === 'county')) {
        return 25; // Very low score
      }
      
      // For other partial matches, give moderate score
      return 50;
    }
    
    // Mixed exact and partial matches
    if (exactWordMatches > 0) {
      return 70 + (exactWordMatches / targetWords.length) * 20;
    }
  }
  
  // Substring matching with word boundary awareness
  if (normalizedHeader.includes(normalizedTarget)) {
    // Check if it's a word boundary match
    const regex = new RegExp(`\\b${normalizedTarget}\\b`);
    if (regex.test(normalizedHeader)) {
      return 80; // Word boundary match
    } else {
      return 60; // Substring match but not word boundary
    }
  }
  
  if (normalizedTarget.includes(normalizedHeader)) {
    const regex = new RegExp(`\\b${normalizedHeader}\\b`);
    if (regex.test(normalizedTarget)) {
      return 75; // Word boundary match
    } else {
      return 55; // Substring match but not word boundary
    }
  }
  
  // Basic character similarity as fallback
  let matchingChars = 0;
  const maxLength = Math.max(normalizedHeader.length, normalizedTarget.length);
  
  for (let i = 0; i < Math.min(normalizedHeader.length, normalizedTarget.length); i++) {
    if (normalizedHeader[i] === normalizedTarget[i]) {
      matchingChars++;
    }
  }
  
  return (matchingChars / maxLength) * 100;
};

// Enhanced column detection with conflict resolution
export const detectColumns = (rawHeaders: string[]): DetectionResult => {
  const mapping: { [standardName: string]: string | null } = {};
  const confidence: { [standardName: string]: number } = {};
  const suggestions: { [standardName: string]: string[] } = {};
  const usedHeaders = new Set<string>();
  
  // First pass: collect all potential matches for each standard column
  const allMatches: { [standardName: string]: Array<{ header: string; score: number }> } = {};
  
  for (const [standardName, variations] of Object.entries(COLUMN_MAPPINGS)) {
    allMatches[standardName] = [];
    
    for (const rawHeader of rawHeaders) {
      let maxScore = 0;
      
      // Test against all variations
      for (const variation of variations) {
        const score = calculateSimilarity(rawHeader, variation);
        maxScore = Math.max(maxScore, score);
      }
      
      if (maxScore >= 30) { // Lower threshold for collecting candidates
        allMatches[standardName].push({ header: rawHeader, score: maxScore });
      }
    }
    
    // Sort by score
    allMatches[standardName].sort((a, b) => b.score - a.score);
  }
  
  // Second pass: resolve conflicts by assigning headers to best matches
  // Process in order of specificity (more specific columns first)
  const processingOrder = [
    'county',           // Process county first to avoid conflict with count
    'transaction_count', // Then transaction count
    'zip_code',         // Then zip code
    'city',             // Then city
    'date',             // Then required columns
    'state',
    'sale_amount'
  ];
  
  for (const standardName of processingOrder) {
    const candidates = allMatches[standardName] || [];
    let bestMatch: { header: string; score: number } | null = null;
    
    // Find the best available match
    for (const candidate of candidates) {
      if (!usedHeaders.has(candidate.header) && candidate.score >= 60) {
        bestMatch = candidate;
        break;
      }
    }
    
    if (bestMatch) {
      mapping[standardName] = bestMatch.header;
      confidence[standardName] = bestMatch.score;
      usedHeaders.add(bestMatch.header);
    } else {
      mapping[standardName] = null;
      confidence[standardName] = 0;
    }
    
    // Store top 3 suggestions (including used headers for reference)
    suggestions[standardName] = candidates
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