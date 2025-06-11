import React, { useEffect, useRef, useState } from 'react';
import { useProgress } from '../context/ProgressContext';

interface AnimatedProgressBarProps {
  progress: number;
  height?: number;
  showPercentage?: boolean;
  showGlow?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  className?: string;
  onAnimationComplete?: () => void;
}

const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height = 8,
  showPercentage = true,
  showGlow = true,
  color = 'blue',
  className = '',
  onAnimationComplete
}) => {
  const { state } = useProgress();
  const [displayProgress, setDisplayProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number>();
  const lastProgressRef = useRef(0);

  const colorClasses = {
    blue: {
      bg: 'bg-blue-500',
      glow: 'shadow-blue-500/50',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-500',
      glow: 'shadow-green-500/50',
      text: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-500',
      glow: 'shadow-purple-500/50',
      text: 'text-purple-600'
    },
    orange: {
      bg: 'bg-orange-500',
      glow: 'shadow-orange-500/50',
      text: 'text-orange-600'
    },
    red: {
      bg: 'bg-red-500',
      glow: 'shadow-red-500/50',
      text: 'text-red-600'
    }
  };

  const colors = colorClasses[color];

  useEffect(() => {
    if (!state.animationsEnabled) {
      setDisplayProgress(progress);
      return;
    }

    const targetProgress = Math.min(100, Math.max(0, progress));
    const startProgress = lastProgressRef.current;
    const progressDiff = targetProgress - startProgress;
    
    if (Math.abs(progressDiff) < 0.1) return;

    setIsAnimating(true);
    const duration = Math.abs(progressDiff) * 20; // Dynamic duration based on change
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const animationProgress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOutCubic(animationProgress);
      
      const currentProgress = startProgress + (progressDiff * easedProgress);
      setDisplayProgress(currentProgress);
      
      if (animationProgress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        lastProgressRef.current = targetProgress;
        onAnimationComplete?.();
      }
    };

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [progress, state.animationsEnabled, onAnimationComplete]);

  useEffect(() => {
    lastProgressRef.current = displayProgress;
  }, [displayProgress]);

  return (
    <div className={`relative ${className}`}>
      {/* Progress Bar Container */}
      <div 
        className="w-full bg-gray-200 rounded-full overflow-hidden relative"
        style={{ height: `${height}px` }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
        
        {/* Progress Fill */}
        <div
          className={`h-full rounded-full transition-all duration-300 relative overflow-hidden ${colors.bg} ${
            showGlow && isAnimating ? `shadow-lg ${colors.glow}` : ''
          }`}
          style={{ 
            width: `${displayProgress}%`,
            transition: state.animationsEnabled ? 'width 0.3s ease-out, box-shadow 0.3s ease-out' : 'none'
          }}
        >
          {/* Animated Shimmer Effect */}
          {state.animationsEnabled && isAnimating && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
          )}
          
          {/* Moving Highlight */}
          {state.animationsEnabled && displayProgress > 0 && (
            <div 
              className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
              style={{
                animation: isAnimating ? 'slide 2s ease-in-out infinite' : 'none'
              }}
            />
          )}
        </div>
        
        {/* Pulse Effect for Active Progress */}
        {state.isProcessing && !state.isPaused && displayProgress > 0 && displayProgress < 100 && (
          <div
            className={`absolute top-0 h-full rounded-full ${colors.bg} opacity-30 animate-pulse`}
            style={{ 
              width: `${Math.min(displayProgress + 5, 100)}%`,
              left: `${Math.max(displayProgress - 5, 0)}%`
            }}
          />
        )}
      </div>

      {/* Percentage Display */}
      {showPercentage && (
        <div className="flex justify-between items-center mt-2">
          <span className={`text-sm font-medium ${colors.text}`}>
            {displayProgress.toFixed(1)}%
          </span>
          
          {state.isProcessing && (
            <div className="flex items-center space-x-2">
              {state.isPaused && (
                <span className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                  Paused
                </span>
              )}
              
              {isAnimating && (
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1 h-1 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(400%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
};

export default AnimatedProgressBar;