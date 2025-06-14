// Nexus Engine Column Mappings
// Mappings for common column names in transaction data files

/**
 * Standard column names and their common variations
 */
export const COLUMN_MAPPINGS = {
  // Transaction ID
  id: [
    'id',
    'transaction_id',
    'Transaction_ID',
    'order_id',
    'invoice_id',
    'reference',
    'reference_id',
    'reference_number',
    'transaction_number',
    'order_number',
    'invoice_number'
  ],
  
  // Transaction Date
  date: [
    'date',
    'transaction_date',
    'Transaction_Date',
    'order_date',
    'invoice_date',
    'sale_date',
    'created_at',
    'created_date',
    'posting_date',
    'document_date'
  ],
  
  // State Code
  state_code: [
    'state',
    'state_code',
    'ShipTo_State',
    'BillTo_State',
    'ship_to_state',
    'bill_to_state',
    'shipping_state',
    'billing_state',
    'customer_state',
    'destination_state',
    'state_province',
    'province',
    'region'
  ],
  
  // Transaction Amount
  amount: [
    'amount',
    'sale_amount',
    'Extended_Amount',
    'total',
    'total_amount',
    'revenue',
    'sales',
    'price',
    'value',
    'invoice_amount',
    'order_total',
    'subtotal',
    'extended_price',
    'sales_amount'
  ],
  
  // Transaction Count / Quantity
  quantity: [
    'quantity',
    'Quantity',
    'transaction_count',
    'count',
    'qty',
    'units',
    'items',
    'line_items',
    'order_count',
    'invoice_count',
    'sales_count',
    'number_of_transactions'
  ],
  
  // Revenue Type
  revenue_type: [
    'revenue_type',
    'Revenue_Type',
    'sales_type',
    'transaction_type',
    'order_type',
    'tax_type',
    'taxability',
    'taxable_type'
  ],
  
  // Product Category
  product_category: [
    'product_category',
    'Product_Category',
    'category',
    'product_type',
    'item_category',
    'item_type',
    'product_class',
    'product_group'
  ],
  
  // Marketplace Facilitator Flag
  marketplace_facilitator: [
    'marketplace_facilitator_flag',
    'Marketplace_Facilitator_Flag',
    'marketplace_facilitator',
    'marketplace_flag',
    'facilitator_flag',
    'mf_flag',
    'is_marketplace',
    'marketplace_sale'
  ],
  
  // Customer Type
  customer_type: [
    'customer_type',
    'Customer_Type',
    'buyer_type',
    'client_type',
    'customer_class',
    'customer_group',
    'customer_category'
  ],
  
  // Exemption Certificate ID
  exemption_certificate: [
    'exemption_certificate_id',
    'Exemption_Certificate_ID',
    'exemption_id',
    'certificate_id',
    'tax_exempt_id',
    'exemption_number',
    'certificate_number',
    'tax_exempt_number'
  ]
};

/**
 * Calculate similarity score between header and target variation
 */
export function calculateSimilarity(header: string, target: string): number {
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
}

/**
 * Detect column mappings from headers
 */
export function detectColumnMappings(headers: string[]): Record<string, string | null> {
  const result: Record<string, string | null> = {
    id: null,
    date: null,
    state_code: null,
    amount: null,
    quantity: null,
    revenue_type: null,
    product_category: null,
    marketplace_facilitator: null,
    customer_type: null,
    exemption_certificate: null
  };
  
  const usedHeaders = new Set<string>();
  
  // Define priority order for detection
  const detectionOrder = [
    'id',
    'date',
    'state_code',
    'amount',
    'quantity',
    'revenue_type',
    'product_category',
    'marketplace_facilitator',
    'customer_type',
    'exemption_certificate'
  ];
  
  // For each standard column in priority order, find the best match
  for (const standardName of detectionOrder) {
    const variations = COLUMN_MAPPINGS[standardName as keyof typeof COLUMN_MAPPINGS];
    let bestMatch: string | null = null;
    let bestScore = 0;
    
    // Test each header against all variations for this standard column
    for (const header of headers) {
      if (usedHeaders.has(header)) continue;
      
      let maxScore = 0;
      
      // Test against all variations
      for (const variation of variations) {
        const score = calculateSimilarity(header, variation);
        maxScore = Math.max(maxScore, score);
      }
      
      if (maxScore > bestScore) {
        bestScore = maxScore;
        bestMatch = header;
      }
    }
    
    // Only accept matches with reasonable confidence (>= 60)
    if (bestMatch && bestScore >= 60) {
      result[standardName] = bestMatch;
      usedHeaders.add(bestMatch);
    }
  }
  
  return result;
}