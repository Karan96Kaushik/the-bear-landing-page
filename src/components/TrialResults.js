import { useState } from 'react';
import moment from 'moment';

export default function TrialResults({ data }) {
  const { params, results, startTime, selectionParams } = data;
  const [state, setState] = useState({
    ui: {
	  showTrialParams: false,
      showOverallStats: true,
      showDailyStats: true,
      showOrderStats: true,
      showWeeklyStats: true,
      showSymbolStats: false,
    },
  });

  const updateState = (path, value) => {
	setState(prev => {
		const newState = { ...prev };
		let current = newState;
		const keys = path.split('.');
		const lastKey = keys.pop();
		
		for (const key of keys) {
			current[key] = { ...current[key] };
			current = current[key];
		}
		
		current[lastKey] = value;
		return newState;
	});
};

/**
 * 
 * TODO : 
 * 
 * FIX WEEKLY STATS
 * 
 * 
 */


  const renderSection = (title, key, content) => (
    <div className="border rounded-lg p-2 mb-2">
      <button
        className="w-full flex justify-between items-center font-semibold"
        onClick={() => updateState(`ui.${key}`, !state.ui[key])}
      >
        <span>{title}</span>
        <span>{state.ui[key] ? '▼' : '▶'}</span>
      </button>
      {state.ui[key] && <div className="mt-2 space-y-1">{content}</div>}
    </div>
  );

  const renderStats = (data, title) => {
    if (!data || data.length === 0) return null;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length);

    return (
      <>
        <div>Mean {title}: {mean.toFixed(2)}</div>
        <div>Std Dev {title}: {stdDev.toFixed(2)}</div>
      </>
    );
  };

  return (
    <div className="space-y-2 p-2">
		<div className="flex flex-row">
			<h2 className="text-lg font-bold">Trial #{moment(startTime).format('DD-MM-YYYY HH:mm') || 'Unknown'}</h2>
		</div>

      {renderSection('Behaviour Params', 'showTrialParams', (
        Object.entries(params || {}).map(([key, value]) => (
          <div key={key} className="text-sm">{key}: {value}</div>
        ))
      ))}

	{renderSection('Selection Params', 'showSelectionParams', (
        Object.entries(selectionParams || {}).map(([key, value]) => (
          <div key={key} className="text-sm">{key}: {value}</div>
        ))
      ))}

      {renderSection('Overall Statistics', 'showOverallStats', (
        <>
          <div>Total PnL: {results.totalPnl?.toFixed(2)}</div>
          <div>Mean PnL per Trade: {results.meanPnlPerTrade?.toFixed(2)}</div>
          <div>Std Dev PnL per Trade: {results.stdDevPnlPerTrade?.toFixed(2)}</div>
          <div>Positive Trades: {results.positiveTrades}</div>
        </>
      ))}

      {renderSection('Daily Statistics', 'showDailyStats', (
        renderStats(
			results.dailyPnl,
          'PnL per Day'
        )
      ))}

      {renderSection('Weekly Statistics', 'showWeeklyStats', (
        renderStats(
			results.weeklyPnl,
          'PnL per Week'
        )
      ))}

      {renderSection('Order Statistics', 'showOrderStats', (
        renderStats(
			results.orderCountStats,
          'Orders per Day'
        )
      ))}

    </div>
  );
}