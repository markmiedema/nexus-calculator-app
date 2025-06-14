# Nexus Analyzer Core Calculation Engine

A TypeScript module for determining if/when a seller first crossed a state's economic nexus thresholds.

## Overview

The Nexus Analyzer engine is designed to process transaction data and determine economic nexus status across U.S. states. It can be used in both Web Workers for browser-based processing and Edge Functions for server-side processing.

## Features

- **Multiple Analysis Modes**:
  - `singleYear`: Analyze a single calendar year (current or historical)
  - `multiYearEstimate`: Quick historical scan across multiple years
  - `multiYearExact`: (Future) Precise historical analysis with rule versioning

- **Flexible Configuration**:
  - Filter marketplace facilitator transactions
  - Include or exclude negative amounts (returns/refunds)
  - Specify analysis year or year range

- **Comprehensive Results**:
  - Nexus status for each state
  - First breach date and transaction ID
  - Total revenue and transaction counts
  - Threshold percentages
  - Detailed warnings and processing statistics

## Usage

### Basic Usage

```typescript
import { analyzeNexus, TransactionRow, EngineOptions } from './utils/nexusEngine';

// Prepare transaction data
const transactions: TransactionRow[] = [
  { 
    id: '1', 
    state_code: 'CA', 
    amount: 100000, 
    date: new Date('2024-01-15'),
    revenue_type: 'taxable'
  },
  // ... more transactions
];

// Configure analysis options
const options: EngineOptions = {
  mode: 'singleYear',
  analysisYear: 2024,
  ignoreMarketplace: true
};

// Run analysis
const result = await analyzeNexus(transactions, options);

// Process results
console.log(`Analyzed ${result.rowsProcessed} transactions in ${result.processingTime}ms`);
console.log(`States with nexus: ${result.nexusResults.filter(r => r.exceeded).length}`);

// Display warnings
result.warnings.forEach(warning => console.warn(warning));
```

### Using with React Hooks

```typescript
import { useNexusEngine } from './utils/nexusEngine/hooks';

function NexusAnalyzer() {
  const { analyze, isProcessing, progress, result, error } = useNexusEngine();
  
  const handleAnalyze = async () => {
    try {
      const transactions = await fetchTransactions();
      const options = {
        mode: 'singleYear',
        analysisYear: 2024
      };
      
      await analyze(transactions, options);
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };
  
  return (
    <div>
      <button onClick={handleAnalyze} disabled={isProcessing}>
        {isProcessing ? 'Analyzing...' : 'Analyze Nexus'}
      </button>
      
      {isProcessing && <ProgressBar value={progress} />}
      
      {error && <ErrorMessage message={error} />}
      
      {result && (
        <div>
          <h2>Analysis Results</h2>
          <p>States with nexus: {result.nexusResults.filter(r => r.exceeded).length}</p>
          {/* Display detailed results */}
        </div>
      )}
    </div>
  );
}
```

### Using with Web Workers

```typescript
import { useNexusEngineWorker } from './utils/nexusEngine/hooks';

function NexusAnalyzerWithWorker() {
  const { 
    analyze, 
    isProcessing, 
    progress, 
    result, 
    error, 
    isWorkerAvailable 
  } = useNexusEngineWorker();
  
  // Similar to the previous example, but uses a Web Worker for processing
}
```

## Architecture

The Nexus Engine is designed with a modular architecture:

- **Core Engine** (`index.ts`): Main entry point and orchestration
- **Types** (`types.ts`): TypeScript interfaces and types
- **Rules** (`rules.ts`): Nexus threshold rules and state validation
- **Strategies** (`strategies.ts`): Implementation of different calculation modes
- **Worker** (`worker.ts`): Web Worker implementation
- **Edge Function** (`edgeFunction.ts`): Supabase Edge Function implementation
- **Hooks** (`hooks.ts`): React hooks for component integration

## Performance Considerations

- The engine processes transactions in batches to maintain UI responsiveness
- Web Workers are used for heavy processing to prevent blocking the main thread
- Edge Functions can be used for server-side processing of very large datasets
- Efficient data structures and algorithms minimize memory usage and processing time

## Future Enhancements (v2)

- **`multiYearExact` Mode**: Precise historical analysis with rule versioning
- **Rule Versioning**: Support for historical nexus rules and effective dates
- **Advanced Filtering**: More sophisticated transaction filtering options
- **Detailed Reporting**: Enhanced reporting capabilities with drill-down analysis