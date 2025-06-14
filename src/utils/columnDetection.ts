// Enhanced column detection with fuzzy matching and confidence scoring
import { detectColumnMappings } from './nexusEngine/columnMappings';

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
    'Transaction_Date',
    'transaction date',
    'transaction_id_date',
    'transaction id date',
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
    'billing date',
    'transaction_date' // Exact match for Transaction_Date
  ],
  state: [
    'state',
    'state_code',
    'ShipTo_State',
    'BillTo_State',
    'state code',
    'st',
    'province',
    'region',
    'ship_to_state',
    'ship to state',
    'shipto_state',
    'shipping_state',
    'shipping state',
    'bill_to_state',
    'bill to state',
    'billto_state',
    'billing_state',
    'billing state',
    'customer_state',
    'customer state',
    'destination_state',
    'destination state',
    'delivery_state',
    'delivery state',
    'shipto_state', // Exact match for ShipTo_State
    'billto_state'  // Exact match for BillTo_State
  ],
  sale_amount: [
    'sale_amount',
    'sale amount',
    'amount',
    'total',
    'total_amount',
    'Extended_Amount',
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
    'extended price',
    'sales amount ($)',
    'extended_amount' // Exact match for Extended_Amount
  ],
  transaction_count: [
    'transaction_count',
    'transaction count',
    'transactions',
    'quantity',
    'Quantity',
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
    'product_count',
    'quantity' // Exact match for Quantity
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
  ],
  // New fields for additional headers
  transaction_id: [
    'transaction_id',
    'Transaction_ID',
    'transaction id',
    'trans_id',
    'order_id',
    'order id',
    'invoice_id',
    'invoice id',
    'id',
    'reference',
    'reference_id',
    'reference id'
  ],
  revenue_type: [
    'revenue_type',
    'Revenue_Type',
    'revenue type',
    'sales_type',
    'sales type',
    'transaction_type',
    'transaction type',
    'order_type',
    'order type'
  ],
  product_category: [
    'product_category',
    'Product_Category',
    'product category',
    'category',
    'product_type',
    'product type',
    'item_category',
    'item category'
  ],
  marketplace_facilitator: [
    'marketplace_facilitator_flag',
    'Marketplace_Facilitator_Flag',
    'marketplace facilitator flag',
    'marketplace_facilitator',
    'marketplace facilitator',
    'marketplace_flag',
    'marketplace flag',
    'facilitator_flag',
    'facilitator flag'
  ],
  customer_type: [
    'customer_type',
    'Customer_Type',
    'customer type',
    'buyer_type',
    'buyer type',
    'client_type',
    'client type'
  ],
  exemption_certificate: [
    'exemption_certificate_id',
    'Exemption_Certificate_ID',
    'exemption certificate id',
    'exemption_id',
    'exemption id',
    'certificate_id',
    'certificate id',
    'tax_exempt_id',
    'tax exempt id'
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
  
  // Special handling for county vs count disambiguation
  if (normalizedHeader === 'county' && normalizedTarget === 'count') {
    return 30; // Low score to prevent confusion
  }
  if (normalizedHeader === 'count' && normalizedTarget === 'county') {
    return 30; // Low score to prevent confusion
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
    // Fix: Cap the similarity score at 100 to prevent scores over 100%
    return Math.min(100, Math.max(70, (matchingChars / maxLength) * 100 + 20));
  }
  
  // Basic character similarity
  return (matchingChars / maxLength) * 100;
};

// Enhanced detection with priority-based matching
export const detectColumns = (rawHeaders: string[]): DetectionResult => {
  const mapping: { [standardName: string]: string | null } = {};
  const confidence: { [standardName: string]: number } = {};
  const suggestions: { [standardName: string]: string[] } = {};
  const usedHeaders = new Set<string>();
  
  // Define priority order for detection (most specific first)
  const detectionOrder = [
    'date',
    'state', 
    'sale_amount',
    'county',        // Detect county before transaction_count
    'city',
    'zip_code',
    'transaction_count',  // Detect transaction_count last
    'transaction_id',
    'revenue_type',
    'product_category',
    'marketplace_facilitator',
    'customer_type',
    'exemption_certificate'
  ];
  
  // For each standard column in priority order, find the best match
  for (const standardName of detectionOrder) {
    const variations = COLUMN_MAPPINGS[standardName];
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
      
      // Apply special rules for disambiguation
      if (standardName === 'county' && rawHeader.toLowerCase() === 'county') {
        maxScore = 100; // Perfect match for county
      }
      
      if (standardName === 'transaction_count' && rawHeader.toLowerCase() === 'county') {
        maxScore = 0; // Never match county to transaction_count
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