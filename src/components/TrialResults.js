import { useState } from 'react';
import moment from 'moment';

export default function TrialResults({ data }) {
  const { params, results, startTime, selectionParams } = data;
  const [state, setState] = useState({
    ui: {
      showTrialParams: false,
      showOverallStats: true,
      showDailyStats: true,
      showOrderStats: false,
      showWeeklyStats: false,
      showSymbolStats: false,
      showDirectionStats: false,
      showHourlyStats: false,
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

  const renderSection = (title, key, content) => (
    <div className="border dark:border-gray-700 rounded-lg p-2 mb-2 dark:bg-gray-750">
      <button
        className="w-full flex justify-between items-center font-semibold dark:text-gray-200"
        onClick={() => updateState(`ui.${key}`, !state.ui[key])}
      >
        <span>{title}</span>
        <span>{state.ui[key] ? '▼' : '▶'}</span>
      </button>
      {state.ui[key] && <div className="mt-2 space-y-1 dark:text-gray-300">{content}</div>}
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
    <div className="space-y-2 p-2 dark:bg-gray-800 rounded-lg">
        <div className="flex flex-row">
            <h2 className="text-lg font-bold dark:text-white">Trial #{moment(startTime).format('DD-MM-YYYY HH:mm') || 'Unknown'}</h2>
        </div>

      {renderSection('Behaviour Params', 'showTrialParams', (
        Object.entries(params || {}).map(([key, value]) => (
          <div key={key} className="text-sm dark:text-gray-300">{key}: {value}</div>
        ))
      ))}

      {renderSection('Selection Params', 'showSelectionParams', (
        Object.entries(selectionParams || {}).map(([key, value]) => (
          <div key={key} className="text-sm dark:text-gray-300">{key}: {value}</div>
        ))
      ))}

      {renderSection('Overall Statistics', 'showOverallStats', (
        <>
          <div>Total PnL: <span className={results.totalPnl >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{results.totalPnl?.toFixed(2)}</span></div>
          <div>Mean PnL per Trade: <span className={results.meanPnlPerTrade >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{results.meanPnlPerTrade ? results.meanPnlPerTrade?.toFixed(2) : 'N/A'}</span></div>
          <div>Std Dev PnL per Trade: {results.stdDevPnlPerTrade ? results.stdDevPnlPerTrade?.toFixed(2) : 'N/A'}</div>
          <div>Positive Trades: {results.positiveTrades} / {results.totalTrades} ({(results.positiveTrades*100 / results.totalTrades).toFixed(2)}%)</div>
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

      {renderSection('Direction Statistics', 'showDirectionStats', (
        Object.keys(results.directionWisePnl || {}).map((key) => {
            const sum = results.directionWisePnl[key].reduce((a, b) => a + b, 0)
            const mean = sum / results.directionWisePnl[key].length;
            const stdDev = Math.sqrt(results.directionWisePnl[key].reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / results.directionWisePnl[key].length);
            console.log(key, sum, mean, stdDev, results.directionWisePnl)
            return (
            <>
                <div key={`${key}-sum`}>{key}: <span className={sum >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{sum.toFixed(2)}</span></div>
                <div key={`${key}-mean`}>- Mean: <span className={mean >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{mean.toFixed(2)}</span></div>
                <div key={`${key}-stddev`}>- Std Dev: {stdDev.toFixed(2)}</div>
                <div key={`${key}-positive`}>- Positive Trades: {results.directionWisePnl[key].filter(pnl => pnl > 0).length} / {results.directionWisePnl[key].length} ({(results.directionWisePnl[key].filter(pnl => pnl > 0).length*100 / results.directionWisePnl[key].length).toFixed(2)}%)</div>
            </>
        )})
      ))}

      {renderSection('Hourly Statistics', 'showHourlyStats', (
        Object.keys(results.hourWisePnl || {}).map((key) => {
            const sum = results.hourWisePnl[key].reduce((a, b) => a + b, 0)
            const mean = sum / results.hourWisePnl[key].length;
            const stdDev = Math.sqrt(results.hourWisePnl[key].reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / results.hourWisePnl[key].length);
            return (
            <>
                <div key={`${key}-sum`}>{key}: <span className={sum >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{sum.toFixed(2)}</span></div>
                <div key={`${key}-mean`}>- Mean: <span className={mean >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{mean.toFixed(2)}</span></div>
                <div key={`${key}-stddev`}>- Std Dev: {stdDev.toFixed(2)}</div>
                <div key={`${key}-positive`}>- Positive Trades: {results.hourWisePnl[key].filter(pnl => pnl > 0).length} / {results.hourWisePnl[key].length} ({(results.hourWisePnl[key].filter(pnl => pnl > 0).length*100 / results.hourWisePnl[key].length).toFixed(2)}%)</div>
            </>
        )})
      ))}

    </div>
  )
}