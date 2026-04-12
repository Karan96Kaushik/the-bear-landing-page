import React, { useMemo, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectResult, loadChartData } from '../../redux/actions/simulatorActions';
import { trialStockColumns } from '../../constants/simulatorConstants';

function getTrialResultSortValue(result, key) {
  const val = result[key]

  if (key === 'vol*') {
    return result.scanData?.currentCandle?.volume / result.scanData?.avgVol?.toFixed(4);
  }
  if (key === 't1*') {
    return result.scanData?.t1Candle?.close > result.scanData?.t1Candle?.open ? 'Bullish' : 'Bearish';
  }
  if (key === 't2*') {
    return result.scanData?.t2Candle?.close > result.scanData?.t2Candle?.open ? 'Bullish' : 'Bearish';
  }
  if (key === 'datetime') {
    const t = val instanceof Date ? val : new Date(val);
    return Number.isNaN(t.getTime()) ? 0 : t.getTime();
  }
  if (key === 'pnl' || key === 'quantity') {
    const n = Number(val);
    return Number.isNaN(n) ? 0 : n;
  }
  if (typeof val === 'number') return val;
  return String(val ?? '').toLowerCase();
}

function TrialResultsTable() {
  const dispatch = useDispatch();
  const { results, loading } = useSelector(state => state.simulator);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const sortedResults = useMemo(() => {
    if (!results?.length) return [];
    if (!sortKey) return results;
    const mult = sortDir === 'asc' ? 1 : -1;
    return [...results].sort((a, b) => {
      const va = getTrialResultSortValue(a, sortKey);
      const vb = getTrialResultSortValue(b, sortKey);
      if (va < vb) return -1 * mult;
      if (va > vb) return 1 * mult;
      return 0;
    });
  }, [results, sortKey, sortDir]);

  const handleHeaderClick = (columnKey, event) => {
    event.stopPropagation();
    if (sortKey === columnKey) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(columnKey);
      setSortDir('asc');
    }
  };

  const handleRowClick = (result) => {
    dispatch(selectResult(result));
    dispatch(loadChartData(result));
  };

  if (!results || results.length === 0) {
    return null;
  }

  if (loading.isLoadingChart) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4 dark:text-white">Trial Results</h2>
        <div className="flex justify-center items-center h-32">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading chart data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Trial Results</h2>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              {trialStockColumns.map(column => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sortKey === column.key
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  className="text-left py-2 px-4 dark:text-gray-300 select-none cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                  onClick={(e) => handleHeaderClick(column.key, e)}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.label}
                    {sortKey === column.key && (
                      <span className="text-gray-500 dark:text-gray-400" aria-hidden>
                        {sortDir === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => (
              <tr 
                key={`${result.symbol}-${result.datetime}-${index}`} 
                className="dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 border-b border-gray-200 dark:border-gray-700"
                onClick={() => handleRowClick(result)}
              >
                {trialStockColumns.map(column => (
                  <td 
                    key={column.key} 
                    className={`py-2 px-4 ${column.classRenderer ? column.classRenderer(result[column.key]) : 'text-gray-900 dark:text-gray-300'}`}
                  >
                    {column.renderer ? column.renderer(result[column.key.includes('*') ? 'scanData' : column.key]) : result[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TrialResultsTable;
