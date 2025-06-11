import React from 'react';
import { ChunkProgress, ProcessingStats } from '../utils/chunkProcessor';
import { Cpu, Clock, BarChart3, Zap, Users } from 'lucide-react';

interface ChunkProgressDisplayProps {
  progress: ChunkProgress;
  stats?: ProcessingStats & { workerStats?: any };
  className?: string;
}

const ChunkProgressDisplay: React.FC<ChunkProgressDisplayProps> = ({
  progress,
  stats,
  className = ''
}) => {
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      {/* Main Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-700">Processing Progress</h3>
          <span className="text-sm text-gray-500">
            {progress.overallProgress.toFixed(1)}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 relative overflow-hidden"
            style={{ width: `${progress.overallProgress}%` }}
          >
            {/* Animated progress indicator */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Chunk Information */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">
            {progress.chunkIndex + 1}
          </div>
          <div className="text-xs text-gray-500">Current Chunk</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-gray-800">
            {progress.totalChunks}
          </div>
          <div className="text-xs text-gray-500">Total Chunks</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">
            {stats?.chunksCompleted || 0}
          </div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">
            {progress.totalChunks - (stats?.chunksCompleted || 0)}
          </div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
      </div>

      {/* Current Chunk Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">
            Chunk {progress.chunkIndex + 1} Progress
          </span>
          <span className="text-xs text-gray-500">
            {progress.chunkProgress.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.chunkProgress}%` }}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
          <Clock className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-medium text-gray-700">Processing Time</div>
            <div className="text-gray-500">{formatTime(progress.processingTime)}</div>
          </div>
        </div>

        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
          <Zap className="h-4 w-4 text-green-500" />
          <div>
            <div className="font-medium text-gray-700">ETA</div>
            <div className="text-gray-500">
              {progress.estimatedTimeRemaining > 0 
                ? formatTime(progress.estimatedTimeRemaining)
                : 'Calculating...'
              }
            </div>
          </div>
        </div>

        {stats?.throughputRowsPerSecond && (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <div>
              <div className="font-medium text-gray-700">Throughput</div>
              <div className="text-gray-500">
                {Math.round(stats.throughputRowsPerSecond)} rows/s
              </div>
            </div>
          </div>
        )}

        {stats?.memoryUsage && (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <Cpu className="h-4 w-4 text-red-500" />
            <div>
              <div className="font-medium text-gray-700">Memory</div>
              <div className="text-gray-500">{formatBytes(stats.memoryUsage)}</div>
            </div>
          </div>
        )}

        {stats?.workerStats && (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <Users className="h-4 w-4 text-indigo-500" />
            <div>
              <div className="font-medium text-gray-700">Workers</div>
              <div className="text-gray-500">
                {stats.workerStats.busyWorkers}/{stats.workerStats.totalWorkers}
              </div>
            </div>
          </div>
        )}

        {stats?.averageChunkTime && (
          <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
            <Clock className="h-4 w-4 text-yellow-500" />
            <div>
              <div className="font-medium text-gray-700">Avg Chunk Time</div>
              <div className="text-gray-500">{formatTime(stats.averageChunkTime)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Worker Pool Status */}
      {stats?.workerStats && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-800">Worker Pool Status</span>
            <span className="text-xs text-blue-600">
              {stats.workerStats.queuedTasks} queued
            </span>
          </div>
          
          <div className="flex space-x-1">
            {Array.from({ length: stats.workerStats.totalWorkers }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i < stats.workerStats.busyWorkers
                    ? 'bg-blue-500'
                    : 'bg-blue-200'
                }`}
                title={`Worker ${i + 1}: ${
                  i < stats.workerStats.busyWorkers ? 'Busy' : 'Available'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChunkProgressDisplay;