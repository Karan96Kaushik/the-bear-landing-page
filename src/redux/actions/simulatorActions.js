import { fetchAuthorizedData, postAuthorizedData } from '../../api/api';
import { 
  formatSimulationResults, 
  processTrialData, 
  generateCombinations,
  calculateProgress,
  calculateTimeRemaining 
} from '../../utils/simulationHelpers';
import { showProgressToast, showSuccessToast } from '../../utils/toastHelpers';
import { MAX_HISTORY_ENTRIES, POLLING_INTERVAL, RETRY_DELAYS } from '../../constants/simulatorConstants';

// Action types
export const SET_SIMULATION_CONFIG = 'simulator/SET_SIMULATION_CONFIG';
export const SET_SELECTION_PARAMS = 'simulator/SET_SELECTION_PARAMS';
export const SET_DATE_RANGE = 'simulator/SET_DATE_RANGE';
export const SET_SELECTED_SYMBOLS = 'simulator/SET_SELECTED_SYMBOLS';

export const START_SIMULATION_REQUEST = 'simulator/START_SIMULATION_REQUEST';
export const START_SIMULATION_SUCCESS = 'simulator/START_SIMULATION_SUCCESS';
export const START_SIMULATION_FAILURE = 'simulator/START_SIMULATION_FAILURE';

export const START_POLLING = 'simulator/START_POLLING';
export const UPDATE_POLLING_PROGRESS = 'simulator/UPDATE_POLLING_PROGRESS';
export const STOP_POLLING = 'simulator/STOP_POLLING';

export const SET_TRIAL_RESULTS = 'simulator/SET_TRIAL_RESULTS';
export const SELECT_RESULT = 'simulator/SELECT_RESULT';
export const LOAD_CHART_DATA_REQUEST = 'simulator/LOAD_CHART_DATA_REQUEST';
export const LOAD_CHART_DATA_SUCCESS = 'simulator/LOAD_CHART_DATA_SUCCESS';

export const ADD_TO_HISTORY = 'simulator/ADD_TO_HISTORY';
export const ADD_TO_TRIALS = 'simulator/ADD_TO_TRIALS';
export const CLEAR_HISTORY = 'simulator/CLEAR_HISTORY';

export const SET_ERROR = 'simulator/SET_ERROR';
export const CLEAR_ERROR = 'simulator/CLEAR_ERROR';
export const INCREMENT_RETRY_COUNT = 'simulator/INCREMENT_RETRY_COUNT';
export const RESET_RETRY_COUNT = 'simulator/RESET_RETRY_COUNT';

export const CANCEL_SIMULATION = 'simulator/CANCEL_SIMULATION';

// Action creators
export const setSimulationConfig = (config) => ({
  type: SET_SIMULATION_CONFIG,
  payload: config
});

export const setSelectionParams = (params) => ({
  type: SET_SELECTION_PARAMS,
  payload: params
});

export const setDateRange = (dateRange) => ({
  type: SET_DATE_RANGE,
  payload: dateRange
});

export const setSelectedSymbols = (symbols) => ({
  type: SET_SELECTED_SYMBOLS,
  payload: symbols
});

export const selectResult = (result) => ({
  type: SELECT_RESULT,
  payload: result
});

export const clearError = () => ({
  type: CLEAR_ERROR
});

export const clearHistory = () => ({
  type: CLEAR_HISTORY
});

/**
 * Cancel ongoing simulation and clear polling state
 */
export const cancelSimulation = () => {
  return (dispatch) => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
    dispatch({ type: CANCEL_SIMULATION });
  };
};

// Async thunks
let pollingIntervalId = null;

/**
 * Start simulation trials
 */
export const startSimulationTrials = () => {
  return async (dispatch, getState) => {
    const state = getState().simulator;
    const { selectionParams, config, dateRange, selectedSymbols } = state;
    
    const combinations = generateCombinations(selectionParams);
    showSuccessToast(`Starting ${combinations.length} simulations...`);

    const tzOffset = new Date().getTimezoneOffset() * 60000;

    const startDate = new Date(+new Date(dateRange[0]) - tzOffset).toISOString().split('T')[0];
    const endDate = new Date(+new Date(dateRange[1]) - tzOffset).toISOString().split('T')[0];

    for (const combination of combinations) {
      try {
        const simulation = { ...config };
        delete simulation.result;
        
        const requestParams = {
          startdate: startDate,
          enddate: endDate,
          symbol: selectedSymbols.join(','),
          simulation,
          selectionParams: combination
        };

        showSuccessToast('Started simulation for ' + Object.keys(combination).join(', '));
        await dispatch(startSingleSimulation(requestParams, dateRange));
      } catch (err) {
        console.error('Error starting simulation:', err);
        dispatch({
          type: SET_ERROR,
          payload: {
            message: err.message || 'Failed to start simulation',
            type: 'SIMULATION_START',
            failedRequest: combination
          }
        });
      }
    }
  };
};

/**
 * Start a single simulation and poll for results
 */
export const startSingleSimulation = (requestParams, dateRange) => {
  return async (dispatch, getState) => {
    dispatch({ type: START_SIMULATION_REQUEST });

    try {
      const response = await postAuthorizedData('/simulation/simulate/v2/start', requestParams);
      const { jobId } = response;

      dispatch({
        type: START_SIMULATION_SUCCESS,
        payload: { jobId }
      });

      // Start polling
      dispatch(startPolling(jobId, requestParams, dateRange));

    } catch (error) {
      dispatch({
        type: START_SIMULATION_FAILURE,
        payload: error.message
      });
      dispatch({
        type: SET_ERROR,
        payload: {
          message: 'Failed to start simulation',
          type: 'SIMULATION_START',
          failedRequest: requestParams
        }
      });
    }
  };
};

/**
 * Start polling for simulation status (persists across navigation)
 */
export const startPolling = (jobId, requestParams, dateRange) => {
  return async (dispatch, getState) => {
    dispatch({
      type: START_POLLING,
      payload: { jobId }
    });

    // Clear any existing polling interval
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    pollingIntervalId = setInterval(async () => {
      try {
        const state = getState().simulator;
        const statusResponse = await fetchAuthorizedData(
          `/simulation/simulate/v2/status/${jobId}?type=${requestParams.simulation.type}`
        );

        if (statusResponse.status === 'completed') {
          // Clear polling
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
          dispatch({ type: STOP_POLLING });

          // Reset retry count on success
          dispatch({ type: RESET_RETRY_COUNT });

          // Format and process results
          const formattedData = formatSimulationResults(
            statusResponse.result, 
            requestParams.simulation.type
          );
          const totalPnl = formattedData.reduce((acc, curr) => acc + curr.pnl, 0);
          const trialData = processTrialData(formattedData);
          const runId = Date.now();

          // Add to history
          dispatch({
            type: ADD_TO_HISTORY,
            payload: {
              id: runId,
              timestamp: new Date().toISOString(),
              params: requestParams,
              dateRange: [new Date(dateRange[0]).toISOString(), new Date(dateRange[1]).toISOString()],
              totalPnl
            }
          });

          // Add to trials
          dispatch({
            type: ADD_TO_TRIALS,
            payload: {
              runId,
              results: trialData,
              params: requestParams.simulation,
              selectionParams: requestParams.selectionParams,
              startTime: statusResponse.startTime
            }
          });

          // Set results
          dispatch({
            type: SET_TRIAL_RESULTS,
            payload: { results: formattedData }
          });

          showSuccessToast('Simulation completed successfully!');

        } else if (statusResponse.status === 'error') {
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
          dispatch({ type: STOP_POLLING });
          
          dispatch({
            type: SET_ERROR,
            payload: {
              message: statusResponse.error || 'Simulation failed',
              type: 'SIMULATION_ERROR',
              failedRequest: requestParams
            }
          });

        } else {
          // Update progress
          const progress = calculateProgress(statusResponse.currentDate, dateRange);
          const timeLeft = calculateTimeRemaining(
            progress.overallProgress, 
            statusResponse.startTime
          );

          dispatch({
            type: UPDATE_POLLING_PROGRESS,
            payload: {
              currentDate: statusResponse.currentDate,
              progress: progress.overallProgress,
              startTime: statusResponse.startTime,
              timeLeft
            }
          });

        }
      } catch (err) {
        console.error('Error polling simulation status:', err);
        dispatch({ type: INCREMENT_RETRY_COUNT });
        
        const state = getState().simulator;
        const retryCount = state.error.retryCount;
        
        if (retryCount >= RETRY_DELAYS.length) {
          // Max retries reached, stop polling
          clearInterval(pollingIntervalId);
          pollingIntervalId = null;
          dispatch({ type: STOP_POLLING });
          
          dispatch({
            type: SET_ERROR,
            payload: {
              message: 'Max retries reached. Simulation polling stopped.',
              type: 'POLLING_ERROR',
              failedRequest: requestParams
            }
          });
        } else {
          // Schedule retry with exponential backoff
          const nextRetryDelay = RETRY_DELAYS[retryCount];
          dispatch({
            type: SET_ERROR,
            payload: {
              message: err.message || 'Error polling simulation status',
              type: 'POLLING_ERROR',
              failedRequest: requestParams,
              nextRetryDelay
            }
          });
        }
      }
    }, POLLING_INTERVAL);
  };
};

/**
 * Stop polling manually
 */
export const stopPolling = () => {
  return (dispatch) => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      pollingIntervalId = null;
    }
    dispatch({ type: STOP_POLLING });
  };
};

/**
 * Retry failed request
 */
export const retryFailedRequest = () => {
  return async (dispatch, getState) => {
    const state = getState().simulator;
    const { error, dateRange } = state;
    
    if (!error.failedRequest) {
      return;
    }

    dispatch({ type: CLEAR_ERROR });
    
    // Retry the failed request
    if (error.type === 'SIMULATION_START') {
      await dispatch(startSingleSimulation(error.failedRequest, dateRange));
    } else if (error.type === 'POLLING_ERROR') {
      // Resume polling
      const jobId = state.pollingState.jobId;
      if (jobId) {
        await dispatch(startPolling(jobId, error.failedRequest, dateRange));
      }
    }
  };
};

/**
 * Load chart data for selected result
 */
export const loadChartData = (result) => {
  return async (dispatch) => {
    dispatch({ type: LOAD_CHART_DATA_REQUEST });
    
    try {
      dispatch({
        type: LOAD_CHART_DATA_SUCCESS,
        payload: {
          data: result.data,
          tradeActions: result.actions,
          pnl: result.pnl,
          perDayResults: result.perDayResults
        }
      });
    } catch (err) {
      dispatch({
        type: SET_ERROR,
        payload: {
          message: err?.message || 'Failed to load chart data',
          type: 'CHART_LOAD'
        }
      });
    }
  };
};
