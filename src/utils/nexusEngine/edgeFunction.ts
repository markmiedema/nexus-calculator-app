// Nexus Engine Edge Function
// Supabase Edge Function implementation for running nexus calculations

import { TransactionRow, EngineOptions, EngineResult } from './types';
import { analyzeNexus } from './index';

// Define request and response types
interface NexusRequest {
  transactions: TransactionRow[];
  options: EngineOptions;
}

interface NexusResponse {
  success: boolean;
  data?: EngineResult;
  error?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

// Handle requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
  
  try {
    // Parse request body
    const requestData: NexusRequest = await req.json();
    
    // Validate input
    if (!requestData.transactions || !Array.isArray(requestData.transactions)) {
      throw new Error('Invalid transactions data');
    }
    
    if (!requestData.options || !requestData.options.mode) {
      throw new Error('Invalid options');
    }
    
    // Process transactions
    const processedTransactions = requestData.transactions.map(row => ({
      ...row,
      date: row.date instanceof Date ? row.date : new Date(row.date)
    }));
    
    // Run analysis
    const result = await analyzeNexus(processedTransactions, requestData.options);
    
    // Return success response
    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
    
  } catch (error) {
    // Return error response
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
});