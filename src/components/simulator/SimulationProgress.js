import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { calculateTimeRemaining } from '../../utils/simulationHelpers';
import { Loader2 } from 'lucide-react';

function SimulationProgress() {
  const { pollingState, error } = useSelector(state => state.simulator);
  const [timeRemaining, setTimeRemaining] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    if (pollingState.isActive && pollingState.startTime && pollingState.progress > 0) {
      const interval = setInterval(() => {
        const remaining = calculateTimeRemaining(pollingState.progress, pollingState.startTime);
        setTimeRemaining(remaining);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [pollingState.isActive, pollingState.startTime, pollingState.progress]);

  if (!pollingState.isActive) {
    return null;
  }

  return (
    <div className="fixed top-20 left-0 right-0 z-40 bg-yellow-500 dark:bg-yellow-600 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-900" />
            <span className="font-semibold text-gray-900">
              Simulation Running: {pollingState.progress}%
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {timeRemaining.minutes > 0 || timeRemaining.seconds > 0 ? (
              <span className="text-sm text-gray-900">
                Estimated time remaining: {timeRemaining.minutes}m {timeRemaining.seconds}s
              </span>
            ) : null}
            
            {error.nextRetryDelay > 0 && (
              <span className="text-sm text-red-900 font-semibold">
                Retrying in {Math.ceil(error.nextRetryDelay / 1000)}s...
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full bg-gray-300 rounded-full h-2">
          <div
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${pollingState.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default SimulationProgress;
