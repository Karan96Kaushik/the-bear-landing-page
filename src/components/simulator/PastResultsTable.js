import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearHistory } from '../../redux/actions/simulatorActions';
import { exportTrialsToCSV } from '../../utils/csvExport';

function PastResultsTable() {
  const dispatch = useDispatch();
  const { history, trials } = useSelector(state => state.simulator);

  if (history.length === 0) {
    return null;
  }

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all history?')) {
      dispatch(clearHistory());
    }
  };

  const handleExportCSV = () => {
    exportTrialsToCSV(trials);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold dark:text-white">Past Simulation Results</h2>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
          >
            Export Trials to CSV
          </button>
          <button
            onClick={handleClearHistory}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
          >
            Clear History
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="text-left py-2 px-4 dark:text-gray-300">Date</th>
              <th className="text-left py-2 px-4 dark:text-gray-300">Symbols</th>
              <th className="text-left py-2 px-4 dark:text-gray-300">Params</th>
              <th className="text-left py-2 px-4 dark:text-gray-300">Date Range</th>
              <th className="text-right py-2 px-4 dark:text-gray-300">Total P&L</th>
            </tr>
          </thead>
          <tbody>
            {history.map((result) => (
              <tr 
                key={result.id} 
                className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 border-b border-gray-200"
              >
                <td className="py-2 px-4 dark:text-gray-300">
                  {new Date(result.timestamp).toLocaleString()}
                </td>
                <td className="py-2 px-4 dark:text-gray-300">
                  {result.params.symbol}
                </td>
                <td className="py-2 px-4 dark:text-gray-300">
                  RE: {!!result.params.simulation.reEnterPosition ? 'Yes' : 'No'} | 
                  USL: {!!result.params.simulation.updateSL ? 'Yes' : 'No'} | 
                  TSLR: {result.params.simulation.targetStopLossRatio} | 
                  CI: {result.params.simulation.cancelInMins}
                </td>
                <td className="py-2 px-4 dark:text-gray-300">
                  {`${result.params.startdate} to ${result.params.enddate}`}
                </td>
                <td className={`text-right py-2 px-4 font-semibold ${result.totalPnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.totalPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PastResultsTable;
