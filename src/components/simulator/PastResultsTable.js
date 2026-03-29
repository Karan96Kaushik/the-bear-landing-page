import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearHistory } from '../../redux/actions/simulatorActions';
import { exportTrialsToCSV } from '../../utils/csvExport';
import TrialResults from '../TrialResults';

function trialForHistoryEntry(result, history, trials) {
  if (!trials?.length) return null;
  const byRunId = trials.find((t) => t.runId === result.id);
  if (byRunId) return byRunId;
  const idx = history.findIndex((h) => h.id === result.id);
  if (idx >= 0 && idx < trials.length) return trials[idx];
  return null;
}

function PastResultsTable() {
  const dispatch = useDispatch();
  const { history, trials } = useSelector((state) => state.simulator);
  const [popupTrial, setPopupTrial] = useState(null);

  const closePopup = useCallback(() => setPopupTrial(null), []);

  useEffect(() => {
    if (!popupTrial) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') closePopup();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [popupTrial, closePopup]);

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

  const openTrialPopup = (result) => {
    const trial = trialForHistoryEntry(result, history, trials);
    setPopupTrial(trial || { _missing: true, result });
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

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        Click a row to open trial statistics for that run.
      </p>

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
                role="button"
                tabIndex={0}
                onClick={() => openTrialPopup(result)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openTrialPopup(result);
                  }
                }}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-700 border-b border-gray-200 cursor-pointer"
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
                <td
                  className={`text-right py-2 px-4 font-semibold ${
                    result.totalPnl >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {result.totalPnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {popupTrial && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4"
          onClick={closePopup}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 relative"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="past-result-trial-title"
          >
            <div className="flex justify-between items-start gap-4 mb-4">
              <h2 id="past-result-trial-title" className="text-xl font-semibold dark:text-white">
                Trial results
              </h2>
              <button
                type="button"
                onClick={closePopup}
                className="shrink-0 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white text-2xl leading-none px-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            {popupTrial._missing ? (
              <p className="text-gray-600 dark:text-gray-300">
                Trial statistics are not available for this run (for example, if history and trials
                are out of sync). Try running a new simulation.
              </p>
            ) : (
              <TrialResults data={popupTrial} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default PastResultsTable;
