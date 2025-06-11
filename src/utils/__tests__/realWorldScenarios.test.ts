import { describe, it, expect } from 'vitest';
import { 
  validateCSVWithSmartDetection,
  generateColumnMappingPreview 
} from '../dataValidation';
import { detectColumns } from '../columnDetection';
import { cleanDataset } from '../dataCleaning';

describe('Real World Scenarios Testing', () => {
  describe('E-commerce Platform Exports', () => {
    it('should handle Shopify export format', () => {
      const shopifyHeaders = [
        'Name',
        'Email',
        'Financial Status',
        'Paid at',
        'Fulfillment Status',
        'Fulfilled at',
        'Accepts Marketing',
        'Currency',
        'Subtotal',
        'Shipping',
        'Taxes',
        'Total',
        'Discount Code',
        'Discount Amount',
        'Shipping Method',
        'Created at',
        'Lineitem quantity',
        'Lineitem name',
        'Lineitem price',
        'Lineitem compare at price',
        'Lineitem sku',
        'Lineitem requires shipping',
        'Lineitem taxable',
        'Lineitem fulfillment status',
        'Billing Name',
        'Billing Street',
        'Billing Address1',
        'Billing Address2',
        'Billing Company',
        'Billing City',
        'Billing Zip',
        'Billing Province',
        'Billing Country',
        'Billing Phone',
        'Shipping Name',
        'Shipping Street',
        'Shipping Address1',
        'Shipping Address2',
        'Shipping Company',
        'Shipping City',
        'Shipping Zip',
        'Shipping Province',
        'Shipping Country',
        'Shipping Phone'
      ];

      const result = detectColumns(shopifyHeaders);

      expect(result.mapping.date).toBe('Created at');
      expect(result.mapping.state).toBe('Billing Province');
      expect(result.mapping.sale_amount).toBe('Total');
      expect(result.mapping.city).toBe('Billing City');
      expect(result.mapping.zip_code).toBe('Billing Zip');
    });

    it('should handle WooCommerce export format', () => {
      const wooCommerceHeaders = [
        'Order ID',
        'Order Number',
        'Order Date',
        'Order Status',
        'Currency',
        'Order Total',
        'Order Subtotal',
        'Order Tax',
        'Order Shipping',
        'Order Discount',
        'Customer ID',
        'Customer Email',
        'Customer Phone',
        'Billing First Name',
        'Billing Last Name',
        'Billing Company',
        'Billing Address 1',
        'Billing Address 2',
        'Billing City',
        'Billing State',
        'Billing Postcode',
        'Billing Country',
        'Shipping First Name',
        'Shipping Last Name',
        'Shipping Company',
        'Shipping Address 1',
        'Shipping Address 2',
        'Shipping City',
        'Shipping State',
        'Shipping Postcode',
        'Shipping Country',
        'Item Name',
        'Item Quantity',
        'Item Price'
      ];

      const result = detectColumns(wooCommerceHeaders);

      expect(result.mapping.date).toBe('Order Date');
      expect(result.mapping.state).toBe('Billing State');
      expect(result.mapping.sale_amount).toBe('Order Total');
      expect(result.mapping.transaction_count).toBe('Item Quantity');
      expect(result.mapping.city).toBe('Billing City');
      expect(result.mapping.zip_code).toBe('Billing Postcode');
    });

    it('should handle Amazon Seller Central format', () => {
      const amazonHeaders = [
        'order-id',
        'order-item-id',
        'purchase-date',
        'payments-date',
        'buyer-email',
        'buyer-name',
        'buyer-phone-number',
        'sku',
        'product-name',
        'quantity-purchased',
        'currency',
        'item-price',
        'item-tax',
        'shipping-price',
        'shipping-tax',
        'gift-wrap-price',
        'gift-wrap-tax',
        'item-promotion-discount',
        'ship-service-level',
        'recipient-name',
        'ship-address-1',
        'ship-address-2',
        'ship-address-3',
        'ship-city',
        'ship-state',
        'ship-postal-code',
        'ship-country',
        'ship-phone-number'
      ];

      const result = detectColumns(amazonHeaders);

      expect(result.mapping.date).toBe('purchase-date');
      expect(result.mapping.state).toBe('ship-state');
      expect(result.mapping.sale_amount).toBe('item-price');
      expect(result.mapping.transaction_count).toBe('quantity-purchased');
      expect(result.mapping.city).toBe('ship-city');
      expect(result.mapping.zip_code).toBe('ship-postal-code');
    });
  });

  describe('Accounting Software Exports', () => {
    it('should handle QuickBooks export format', () => {
      const quickBooksHeaders = [
        'Transaction Type',
        'Date',
        'Transaction Number',
        'Name',
        'Memo/Description',
        'Account',
        'Split',
        'Amount',
        'Balance',
        'Customer',
        'Vendor',
        'Employee',
        'Product/Service',
        'Billing Address',
        'Shipping Address',
        'City',
        'State/Province',
        'ZIP/Postal Code',
        'Country'
      ];

      const result = detectColumns(quickBooksHeaders);

      expect(result.mapping.date).toBe('Date');
      expect(result.mapping.state).toBe('State/Province');
      expect(result.mapping.sale_amount).toBe('Amount');
      expect(result.mapping.city).toBe('City');
      expect(result.mapping.zip_code).toBe('ZIP/Postal Code');
    });

    it('should handle Xero export format', () => {
      const xeroHeaders = [
        'Contact',
        'Email',
        'POAddressLine1',
        'POAddressLine2',
        'POAddressLine3',
        'POAddressLine4',
        'POCity',
        'PORegion',
        'POPostalCode',
        'POCountry',
        'InvoiceNumber',
        'Reference',
        'InvoiceDate',
        'DueDate',
        'Total',
        'InventoryItemCode',
        'Description',
        'Quantity',
        'UnitAmount',
        'Discount',
        'LineAmount',
        'AccountCode',
        'TaxType',
        'TaxAmount',
        'TrackingName1',
        'TrackingOption1',
        'TrackingName2',
        'TrackingOption2',
        'Currency',
        'Type',
        'Sent',
        'Status'
      ];

      const result = detectColumns(xeroHeaders);

      expect(result.mapping.date).toBe('InvoiceDate');
      expect(result.mapping.state).toBe('PORegion');
      expect(result.mapping.sale_amount).toBe('Total');
      expect(result.mapping.transaction_count).toBe('Quantity');
      expect(result.mapping.city).toBe('POCity');
      expect(result.mapping.zip_code).toBe('POPostalCode');
    });
  });

  describe('Point of Sale Systems', () => {
    it('should handle Square POS export format', () => {
      const squareHeaders = [
        'Date',
        'Time',
        'Time Zone',
        'Gross Sales',
        'Discounts',
        'Net Sales',
        'Gift Card Sales',
        'Tax',
        'Tip',
        'Partial Refunds',
        'Total Collected',
        'Source',
        'Card',
        'Card Entry Methods',
        'Cash',
        'Square Gift Card',
        'Other Tender',
        'Other Tender Type',
        'Other Tender Note',
        'Fees',
        'Net Total',
        'Transaction ID',
        'Payment ID',
        'Card Brand',
        'PAN Suffix',
        'Device Name',
        'Staff Name',
        'Staff ID',
        'Details',
        'Description',
        'Event Type',
        'Location',
        'Dining Option'
      ];

      const result = detectColumns(squareHeaders);

      expect(result.mapping.date).toBe('Date');
      expect(result.mapping.sale_amount).toBe('Net Sales');
      // Note: Square doesn't typically include state in transaction exports
    });

    it('should handle Toast POS export format', () => {
      const toastHeaders = [
        'Order GUID',
        'Order Number',
        'Order Date',
        'Order Time',
        'Restaurant',
        'Revenue Center',
        'Service Area',
        'Check Number',
        'Table',
        'Party Size',
        'Server',
        'Order Type',
        'Order Source',
        'Delivery Address',
        'Delivery City',
        'Delivery State',
        'Delivery Zip',
        'Customer Name',
        'Customer Phone',
        'Customer Email',
        'Subtotal',
        'Tax',
        'Tip',
        'Total',
        'Payment Method',
        'Item Name',
        'Item Quantity',
        'Item Price',
        'Item Category'
      ];

      const result = detectColumns(toastHeaders);

      expect(result.mapping.date).toBe('Order Date');
      expect(result.mapping.state).toBe('Delivery State');
      expect(result.mapping.sale_amount).toBe('Total');
      expect(result.mapping.transaction_count).toBe('Item Quantity');
      expect(result.mapping.city).toBe('Delivery City');
      expect(result.mapping.zip_code).toBe('Delivery Zip');
    });
  });

  describe('Custom Business Systems', () => {
    it('should handle manufacturing company format', () => {
      const manufacturingHeaders = [
        'Invoice_ID',
        'Ship_Date',
        'Customer_Code',
        'Customer_Name',
        'Ship_To_Address_Line_1',
        'Ship_To_Address_Line_2',
        'Ship_To_City',
        'Ship_To_State_Province',
        'Ship_To_Postal_Code',
        'Ship_To_Country',
        'Product_SKU',
        'Product_Description',
        'Units_Shipped',
        'Unit_Price',
        'Extended_Price',
        'Freight_Charges',
        'Sales_Tax',
        'Invoice_Total',
        'Terms',
        'Sales_Rep',
        'Territory'
      ];

      const result = detectColumns(manufacturingHeaders);

      expect(result.mapping.date).toBe('Ship_Date');
      expect(result.mapping.state).toBe('Ship_To_State_Province');
      expect(result.mapping.sale_amount).toBe('Invoice_Total');
      expect(result.mapping.transaction_count).toBe('Units_Shipped');
      expect(result.mapping.city).toBe('Ship_To_City');
      expect(result.mapping.zip_code).toBe('Ship_To_Postal_Code');
    });

    it('should handle service company format', () => {
      const serviceHeaders = [
        'Service_Date',
        'Client_ID',
        'Client_Name',
        'Service_Location_Address',
        'Service_Location_City',
        'Service_Location_State',
        'Service_Location_ZIP',
        'Service_Type',
        'Service_Description',
        'Hours_Worked',
        'Hourly_Rate',
        'Materials_Cost',
        'Total_Service_Amount',
        'Technician',
        'Status',
        'Invoice_Number',
        'Payment_Status'
      ];

      const result = detectColumns(serviceHeaders);

      expect(result.mapping.date).toBe('Service_Date');
      expect(result.mapping.state).toBe('Service_Location_State');
      expect(result.mapping.sale_amount).toBe('Total_Service_Amount');
      expect(result.mapping.city).toBe('Service_Location_City');
      expect(result.mapping.zip_code).toBe('Service_Location_ZIP');
    });
  });

  describe('Data Quality Scenarios', () => {
    it('should handle mixed data quality in real dataset', () => {
      const mixedQualityData = [
        {
          'Transaction Date': '2024-01-01',
          'State': 'California',
          'Sales Amount ($)': '$1,234.56',
          'Transaction Count': '2',
          'Customer City': 'Los Angeles',
          'County': 'Los Angeles County',
          'Zip Code': '90210'
        },
        {
          'Transaction Date': '01/02/2024', // Different date format
          'State': 'TX', // Already a code
          'Sales Amount ($)': '2500.00', // No currency symbol
          'Transaction Count': '', // Empty
          'Customer City': '  Houston  ', // Extra whitespace
          'County': 'Harris County',
          'Zip Code': '77001'
        },
        {
          'Transaction Date': '2024-01-03',
          'State': 'New York', // Full state name
          'Sales Amount ($)': '($500.00)', // Negative in parentheses
          'Transaction Count': '1',
          'Customer City': 'New York',
          'County': 'New York County',
          'Zip Code': '10001'
        },
        {
          'Transaction Date': 'invalid-date', // Invalid date
          'State': 'INVALID_STATE', // Invalid state
          'Sales Amount ($)': 'not-a-number', // Invalid amount
          'Transaction Count': '-5', // Negative count
          'Customer City': 'Invalid City',
          'County': 'Invalid County',
          'Zip Code': 'invalid'
        },
        {
          'Transaction Date': '2024-01-05',
          'State': 'Fla', // Abbreviation
          'Sales Amount ($)': '€999.99', // Different currency
          'Transaction Count': '3',
          'Customer City': 'Miami',
          'County': 'Miami-Dade County',
          'Zip Code': '33101'
        }
      ];

      const mapping = {
        date: 'Transaction Date',
        state: 'State',
        sale_amount: 'Sales Amount ($)',
        transaction_count: 'Transaction Count',
        city: 'Customer City',
        county: 'County',
        zip_code: 'Zip Code'
      };

      const { cleanedData, report } = cleanDataset(mixedQualityData, mapping);

      // Should clean and process valid rows
      expect(cleanedData.length).toBeGreaterThan(0);
      expect(cleanedData.length).toBeLessThan(mixedQualityData.length); // Some rows should be filtered out
      
      // Should have cleaning modifications
      expect(report.modifications.currencySymbolsRemoved).toBeGreaterThan(0);
      expect(report.modifications.stateNamesConverted).toBeGreaterThan(0);
      expect(report.modifications.dateFormatsNormalized).toBeGreaterThan(0);
      
      // Should have warnings and errors
      expect(report.warnings.length).toBeGreaterThan(0);
      expect(report.errors.length).toBeGreaterThan(0);
    });

    it('should handle international data formats', () => {
      const internationalData = [
        {
          'Date': '15/01/2024', // DD/MM/YYYY format
          'State': 'California',
          'Amount': '1.234,56 €', // European number format
          'Count': '2'
        },
        {
          'Date': '2024年1月16日', // Chinese date format
          'State': 'Texas',
          'Amount': '¥10,000', // Japanese Yen
          'Count': '1'
        },
        {
          'Date': '16.01.2024', // German date format
          'State': 'New York',
          'Amount': '1 500,00 $', // French number format
          'Count': '3'
        }
      ];

      const mapping = {
        date: 'Date',
        state: 'State',
        sale_amount: 'Amount',
        transaction_count: 'Count',
        city: null,
        county: null,
        zip_code: null
      };

      const { cleanedData, report } = cleanDataset(internationalData, mapping);

      // Should handle some international formats
      expect(cleanedData.length).toBeGreaterThan(0);
      expect(report.warnings.length).toBeGreaterThan(0); // Should warn about unusual formats
    });

    it('should handle very large individual field values', () => {
      const largeFieldData = [
        {
          'Date': '2024-01-01',
          'State': 'CA',
          'Amount': '$999,999,999.99', // Very large amount
          'Count': '1000', // Large count
          'City': 'A'.repeat(1000), // Very long city name
          'County': 'B'.repeat(500), // Very long county name
          'Address': 'C'.repeat(2000) // Very long address
        }
      ];

      const mapping = {
        date: 'Date',
        state: 'State',
        sale_amount: 'Amount',
        transaction_count: 'Count',
        city: 'City',
        county: 'County',
        customer_address: 'Address'
      };

      const { cleanedData, report } = cleanDataset(largeFieldData, mapping);

      expect(cleanedData.length).toBe(1);
      expect(cleanedData[0].sale_amount).toBe(999999999.99);
      expect(cleanedData[0].transaction_count).toBe(1000);
      expect(report.warnings.some(w => w.includes('Large'))).toBe(true);
    });
  });

  describe('User's Actual Data Format', () => {
    it('should handle the exact format from user screenshot', () => {
      const userData = [
        {
          'Transaction Date': '2022-01-05',
          'State': 'California',
          'County': 'San Diego County',
          'City': 'San Diego',
          'Sales Amount ($)': '1814.99'
        },
        {
          'Transaction Date': '2022-01-23',
          'State': 'California',
          'County': 'San Diego County',
          'City': 'San Diego',
          'Sales Amount ($)': '1726.79'
        },
        {
          'Transaction Date': '2022-01-04',
          'State': 'California',
          'County': 'San Diego County',
          'City': 'San Diego',
          'Sales Amount ($)': '720.39'
        }
      ];

      // Test column detection
      const headers = Object.keys(userData[0]);
      const detectionResult = detectColumns(headers);

      expect(detectionResult.mapping.date).toBe('Transaction Date');
      expect(detectionResult.mapping.state).toBe('State');
      expect(detectionResult.mapping.sale_amount).toBe('Sales Amount ($)');
      expect(detectionResult.mapping.city).toBe('City');
      expect(detectionResult.mapping.county).toBe('County');

      // Test validation
      const validationResult = validateCSVWithSmartDetection(userData);
      expect(validationResult.isValid).toBe(true);

      // Test data cleaning
      const mapping = detectionResult.mapping;
      const { cleanedData, report } = cleanDataset(userData, mapping);

      expect(cleanedData.length).toBe(3);
      expect(cleanedData[0].date).toBe('2022-01-05');
      expect(cleanedData[0].state).toBe('CA'); // Should convert to state code
      expect(cleanedData[0].sale_amount).toBe(1814.99);
      expect(cleanedData[0].city).toBe('San Diego');
      expect(cleanedData[0].county).toBe('San Diego County');

      // Should have state name conversion
      expect(report.modifications.stateNamesConverted).toBe(3);
    });

    it('should generate correct preview for user data', () => {
      const userData = [
        {
          'Transaction Date': '2022-01-05',
          'State': 'California',
          'County': 'San Diego County',
          'City': 'San Diego',
          'Sales Amount ($)': '1814.99'
        }
      ];

      const validationResult = validateCSVWithSmartDetection(userData);
      expect(validationResult.detectionResult).toBeDefined();

      const preview = generateColumnMappingPreview(validationResult.detectionResult!);

      expect(preview.canProceed).toBe(true);
      expect(preview.overallConfidence).toBeGreaterThan(80);
      
      const dateMapping = preview.detectedMappings.find(m => m.standardColumn === 'date');
      expect(dateMapping?.detectedHeader).toBe('Transaction Date');
      expect(dateMapping?.status).toBe('detected');

      const stateMapping = preview.detectedMappings.find(m => m.standardColumn === 'state');
      expect(stateMapping?.detectedHeader).toBe('State');
      expect(stateMapping?.status).toBe('detected');

      const amountMapping = preview.detectedMappings.find(m => m.standardColumn === 'sale_amount');
      expect(amountMapping?.detectedHeader).toBe('Sales Amount ($)');
      expect(amountMapping?.status).toBe('detected');
    });
  });
});