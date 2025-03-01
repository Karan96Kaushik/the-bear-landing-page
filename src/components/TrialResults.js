import { useState } from 'react';
import moment from 'moment';

export default function TrialResults({ data }) {
  const { params, data: trialData, startTime, selectionParams } = data;
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

      {renderSection('Trial Params', 'showTrialParams', (
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
          <div>Total PnL: {trialData.reduce((acc, curr) => acc + curr.pnl, 0)?.toFixed(2)}</div>
          <div>Mean PnL per Trade: {(trialData.reduce((acc, curr) => acc + curr.pnl, 0) / trialData.length)?.toFixed(2)}</div>
          <div>Std Dev PnL per Trade: {Math.sqrt(trialData.reduce((acc, curr) => {
            const mean = trialData.reduce((a, c) => a + c.pnl, 0) / trialData.length;
            return acc + Math.pow(curr.pnl - mean, 2);
          }, 0) / trialData.length)?.toFixed(2)}</div>
          <div>Positive Trades: {trialData.filter(r => r.pnl > 0).length} / {trialData.length} ({(trialData.filter(r => r.pnl > 0).length / trialData.length * 100)?.toFixed(2)}%)</div>
        </>
      ))}

      {renderSection('Daily Statistics', 'showDailyStats', (
        renderStats(
          Object.values(
            trialData.reduce((acc, curr) => {
              const date = curr.timestamp.toISOString().split('T')[0];
              acc[date] = acc[date] || [];
              acc[date].push(curr.pnl);
              return acc;
            }, {})
          ).map(pnls => pnls.reduce((a, b) => a + b, 0)),
          'PnL per Day'
        )
      ))}

      {renderSection('Weekly Statistics', 'showWeeklyStats', (
        renderStats(
          Object.values(
            trialData.reduce((acc, curr) => {
              const date = new Date(curr.timestamp);
              const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + date.getDay()) / 7)}`;
              acc[weekKey] = acc[weekKey] || [];
              acc[weekKey].push(curr.pnl);

			  console.log('----', `W${Math.ceil((date.getDate() + date.getDay()) / 7)}`, date, date.getDate(), date.getDay(), curr.date)
              return acc;
            }, {})
          ).map(pnls => pnls.reduce((a, b) => a + b, 0)),
          'PnL per Week'
        )
      ))}

      {renderSection('Order Statistics', 'showOrderStats', (
        renderStats(
          Object.values(
            trialData.reduce((acc, curr) => {
              const date = curr.timestamp.toISOString().split('T')[0];
              acc[date] = acc[date] || 0;
              acc[date]++;
              return acc;
            }, {})
          ),
          'Orders per Day'
        )
      ))}

      {renderSection('Symbol-wise Statistics', 'showSymbolStats', (
        Object.entries(
          trialData.reduce((acc, curr) => {
            const symbol = curr.symbol;
            acc[symbol] = acc[symbol] || [];
            acc[symbol].push(curr.pnl);
            return acc;
          }, {})
        ).map(([symbol, pnls]) => {
          const mean = pnls.reduce((a, b) => a + b, 0) / pnls.length;
          const stdDev = Math.sqrt(pnls.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / pnls.length);
          return (
            <div key={symbol} className="ml-2">
              <div>{symbol}:</div>
              <div className="ml-2">Mean PnL: {mean.toFixed(2)}</div>
              <div className="ml-2">Std Dev: {stdDev.toFixed(2)}</div>
              <div className="ml-2">Number of Trades: {pnls.length}</div>
            </div>
          );
        })
      ))}
    </div>
  );
}