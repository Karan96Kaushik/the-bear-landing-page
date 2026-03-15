import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Loader2 } from 'lucide-react';
import SimulationForm from '../components/simulator/SimulationForm';
import AdvancedSettings from '../components/simulator/AdvancedSettings';
import SimulationProgress from '../components/simulator/SimulationProgress';
import TrialResultsTable from '../components/simulator/TrialResultsTable';
import PastResultsTable from '../components/simulator/PastResultsTable';
import TrialStatisticsGrid from '../components/simulator/TrialStatisticsGrid';
import SimulationResults from '../components/SimulationResults';
import { 
  startSimulationTrials,
  retryFailedRequest,
  clearError,
  cancelSimulation
} from '../redux/actions/simulatorActions';
import { showErrorToastWithActions } from '../utils/toastHelpers';

const ShortSellingSimulatorPage = () => {
  const dispatch = useDispatch();
  const { 
    selectedResult, 
    selectedResultData, 
    loading, 
    error 
  } = useSelector(state => state.simulator);

  // Watch for errors and show toast with retry/clear actions
  useEffect(() => {
    if (error.message) {
      showErrorToastWithActions(
        error,
        dispatch,
        retryFailedRequest,
        clearError,
        error.nextRetryDelay
      );
    }
  }, [error.message, error.nextRetryDelay, dispatch]);

  const handleRunTrials = () => {
    dispatch(startSimulationTrials());
  };

  const handleCancel = () => {
    dispatch(cancelSimulation());
  };

  return (
    <div className="bg-gray-900 dark:bg-gray-950 min-h-screen relative">
      {/* Simulation Progress - Sticky Header */}
      {/* <SimulationProgress /> */}
      
      <div className={`container mx-auto px-4 ${loading.isPolling ? 'pt-32' : 'pt-20'} py-8`}>
        <h1 className="text-3xl font-bold mb-6 text-white">Simulator V3</h1>

        {/* Configuration Section */}
        <SimulationForm />
        <AdvancedSettings />

        {/* Run Trials Button */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
          {loading.isSimulating || loading.isPolling ? (
            <button 
              onClick={handleCancel} 
              className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 items-center justify-center flex transition-colors"
            >
              <Loader2 className="h-8 w-8 text-white animate-spin mr-2" />
              Cancel
            </button>
          ) : (
            <button 
              onClick={handleRunTrials} 
              className="w-full bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700 items-center justify-center flex transition-colors"
            >
              Run Trials
            </button>
          )}
        </div>

        {/* Active Trial Results */}
        <TrialResultsTable />

        {/* Selected Result Chart */}
        {selectedResult && selectedResultData && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold dark:text-white">
                Chart for {selectedResult.symbol} on {selectedResult.date}
              </h3>
              <button 
                className="bg-indigo-500 text-white px-4 py-2 rounded-md hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-700"
                onClick={() => dispatch({ type: 'simulator/SELECT_RESULT', payload: null })}
              >
                Close
              </button>
            </div>
            <SimulationResults
              data={selectedResultData.data}
              tradeActions={selectedResultData.tradeActions}
              pnl={selectedResultData.pnl}
              symbol={selectedResult.symbol}
              perDayResults={selectedResultData.perDayResults}
            />
          </div>
        )}

        {/* Past Results */}
        <PastResultsTable />

        {/* Trial Statistics */}
        <TrialStatisticsGrid />
      </div>
    </div>
  );
};

export default ShortSellingSimulatorPage;

