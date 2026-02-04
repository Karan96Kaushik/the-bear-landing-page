import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectResult, loadChartData } from '../../redux/actions/simulatorActions';
import { trialStockColumns } from '../../constants/simulatorConstants';

function TrialResultsTable() {
  const dispatch = useDispatch();
  const { results, loading } = useSelector(state => state.simulator);

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
                <th key={column.key} className="text-left py-2 px-4 dark:text-gray-300">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
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
                    {column.renderer ? column.renderer(result[column.key]) : result[column.key]}
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
