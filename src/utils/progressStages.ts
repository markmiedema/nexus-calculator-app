// Predefined processing stages for different operations
import { ProcessingStage } from '../components/ProgressIndicator';

export const CSV_PROCESSING_STAGES: Omit<ProcessingStage, 'progress' | 'status'>[] = [
  {
    id: 'file-reading',
    name: 'Reading File',
    description: 'Loading and parsing CSV/Excel file data'
  },
  {
    id: 'column-detection',
    name: 'Column Detection',
    description: 'Identifying and mapping data columns using smart detection'
  },
  {
    id: 'data-validation',
    name: 'Data Validation',
    description: 'Validating data quality and checking for errors'
  },
  {
    id: 'data-cleaning',
    name: 'Data Cleaning',
    description: 'Cleaning and normalizing data values'
  },
  {
    id: 'aggregation',
    name: 'Data Aggregation',
    description: 'Grouping sales data by state and time period'
  },
  {
    id: 'nexus-calculation',
    name: 'Nexus Analysis',
    description: 'Calculating nexus thresholds and compliance status'
  },
  {
    id: 'tax-calculation',
    name: 'Tax Calculation',
    description: 'Computing estimated tax liabilities and rates'
  },
  {
    id: 'report-generation',
    name: 'Report Generation',
    description: 'Generating final analysis and recommendations'
  }
];

export const CHUNKED_PROCESSING_STAGES: Omit<ProcessingStage, 'progress' | 'status'>[] = [
  {
    id: 'chunk-preparation',
    name: 'Chunk Preparation',
    description: 'Dividing data into optimal processing chunks'
  },
  {
    id: 'worker-initialization',
    name: 'Worker Setup',
    description: 'Initializing worker pool for parallel processing'
  },
  {
    id: 'chunk-processing',
    name: 'Chunk Processing',
    description: 'Processing data chunks in parallel workers'
  },
  {
    id: 'result-aggregation',
    name: 'Result Aggregation',
    description: 'Combining results from all processed chunks'
  },
  {
    id: 'final-analysis',
    name: 'Final Analysis',
    description: 'Performing final calculations and generating report'
  }
];

export const WEB_WORKER_STAGES: Omit<ProcessingStage, 'progress' | 'status'>[] = [
  {
    id: 'worker-initialization',
    name: 'Worker Initialization',
    description: 'Setting up background processing worker'
  },
  {
    id: 'data-transfer',
    name: 'Data Transfer',
    description: 'Transferring data to background worker'
  },
  {
    id: 'background-processing',
    name: 'Background Processing',
    description: 'Processing data in background thread'
  },
  {
    id: 'result-transfer',
    name: 'Result Transfer',
    description: 'Receiving processed results from worker'
  },
  {
    id: 'finalization',
    name: 'Finalization',
    description: 'Finalizing results and updating UI'
  }
];

export const FALLBACK_PROCESSING_STAGES: Omit<ProcessingStage, 'progress' | 'status'>[] = [
  {
    id: 'main-thread-setup',
    name: 'Setup',
    description: 'Preparing for main thread processing'
  },
  {
    id: 'sequential-processing',
    name: 'Sequential Processing',
    description: 'Processing data sequentially on main thread'
  },
  {
    id: 'progress-updates',
    name: 'Progress Updates',
    description: 'Updating progress and maintaining UI responsiveness'
  },
  {
    id: 'completion',
    name: 'Completion',
    description: 'Finalizing processing and preparing results'
  }
];

// Helper function to get stages based on processing strategy
export const getStagesForStrategy = (
  strategy: 'chunked' | 'worker' | 'fallback' | 'standard'
): Omit<ProcessingStage, 'progress' | 'status'>[] => {
  switch (strategy) {
    case 'chunked':
      return CHUNKED_PROCESSING_STAGES;
    case 'worker':
      return WEB_WORKER_STAGES;
    case 'fallback':
      return FALLBACK_PROCESSING_STAGES;
    case 'standard':
    default:
      return CSV_PROCESSING_STAGES;
  }
};

// Helper function to estimate stage durations (in percentage of total time)
export const getStageWeights = (
  strategy: 'chunked' | 'worker' | 'fallback' | 'standard'
): Record<string, number> => {
  switch (strategy) {
    case 'chunked':
      return {
        'chunk-preparation': 5,
        'worker-initialization': 10,
        'chunk-processing': 70,
        'result-aggregation': 10,
        'final-analysis': 5
      };
    case 'worker':
      return {
        'worker-initialization': 10,
        'data-transfer': 15,
        'background-processing': 60,
        'result-transfer': 10,
        'finalization': 5
      };
    case 'fallback':
      return {
        'main-thread-setup': 5,
        'sequential-processing': 80,
        'progress-updates': 10,
        'completion': 5
      };
    case 'standard':
    default:
      return {
        'file-reading': 10,
        'column-detection': 5,
        'data-validation': 10,
        'data-cleaning': 25,
        'aggregation': 20,
        'nexus-calculation': 15,
        'tax-calculation': 10,
        'report-generation': 5
      };
  }
};