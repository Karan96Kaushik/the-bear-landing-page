import React from 'react';
import { useSelector } from 'react-redux';
import TrialResults from '../TrialResults';

function TrialStatisticsGrid() {
  const { trials } = useSelector(state => state.simulator);

  if (!trials || trials.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Trial Statistics</h2>
      <div className="space-y-4">
        {trials.map((trial, index) => (
          <TrialResults
            key={`trial-${index}-${trial.startTime}`}
            data={trial}
          />
        ))}
      </div>
    </div>
  );
}

export default TrialStatisticsGrid;
