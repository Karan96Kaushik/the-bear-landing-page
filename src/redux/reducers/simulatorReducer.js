import { persistReducer } from 'redux-persist';
import { simulatorPersistConfig } from '../persistConfig';
import {
  SET_SIMULATION_CONFIG,
  SET_SELECTION_PARAMS,
  SET_DATE_RANGE,
  SET_SELECTED_SYMBOLS,
  START_SIMULATION_REQUEST,
  START_SIMULATION_SUCCESS,
  START_SIMULATION_FAILURE,
  START_POLLING,
  UPDATE_POLLING_PROGRESS,
  STOP_POLLING,
  SET_TRIAL_RESULTS,
  SELECT_RESULT,
  LOAD_CHART_DATA_REQUEST,
  LOAD_CHART_DATA_SUCCESS,
  ADD_TO_HISTORY,
  ADD_TO_TRIALS,
  CLEAR_HISTORY,
  SET_ERROR,
  CLEAR_ERROR,
  INCREMENT_RETRY_COUNT,
  RESET_RETRY_COUNT
} from '../actions/simulatorActions';
import { defaultSimulationState, initialSelectionParamOptions, MAX_HISTORY_ENTRIES } from '../../constants/simulatorConstants';

const initialState = {
  // Configuration
  config: defaultSimulationState,
  selectionParams: initialSelectionParamOptions.benoit,
  dateRange: [new Date('2025-10-15'), new Date('2025-10-15')],
  selectedSymbols: [],
  
  // Polling state (persists across navigation)
  pollingState: {
    jobId: null,
    isActive: false,
    currentDate: null,
    progress: 0,
    startTime: null
  },
  
  // Results
  results: null,
  selectedResult: null,
  selectedResultData: null,
  
  // History (FIFO, max 100)
  history: [],
  trials: [],
  
  // Loading states (granular)
  loading: {
    isSimulating: false,
    isPolling: false,
    isLoadingChart: false
  },
  
  // Error state with retry
  error: {
    message: null,
    type: null,
    failedRequest: null,
    retryCount: 0,
    nextRetryDelay: 0
  }
};

const simulatorReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_SIMULATION_CONFIG:
      return {
        ...state,
        config: { ...state.config, ...action.payload }
      };
      
    case SET_SELECTION_PARAMS:
      return {
        ...state,
        selectionParams: action.payload
      };
      
    case SET_DATE_RANGE:
      return {
        ...state,
        dateRange: action.payload
      };
      
    case SET_SELECTED_SYMBOLS:
      return {
        ...state,
        selectedSymbols: action.payload
      };
      
    case START_SIMULATION_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, isSimulating: true },
        error: initialState.error
      };
      
    case START_SIMULATION_SUCCESS:
      return {
        ...state,
        loading: { ...state.loading, isSimulating: false }
      };
      
    case START_SIMULATION_FAILURE:
      return {
        ...state,
        loading: { ...state.loading, isSimulating: false }
      };
      
    case START_POLLING:
      return {
        ...state,
        pollingState: {
          jobId: action.payload.jobId,
          isActive: true,
          currentDate: null,
          progress: 0,
          startTime: new Date().toISOString()
        },
        loading: { ...state.loading, isPolling: true },
        selectedResult: null,
        selectedResultData: null
      };
      
    case UPDATE_POLLING_PROGRESS:
      return {
        ...state,
        pollingState: {
          ...state.pollingState,
          currentDate: action.payload.currentDate,
          progress: action.payload.progress,
          startTime: action.payload.startTime
        }
      };
      
    case STOP_POLLING:
      return {
        ...state,
        pollingState: {
          ...state.pollingState,
          isActive: false
        },
        loading: { ...state.loading, isPolling: false }
      };
      
    case SET_TRIAL_RESULTS:
      return {
        ...state,
        results: action.payload.results
      };
      
    case SELECT_RESULT:
      return {
        ...state,
        selectedResult: action.payload
      };
      
    case LOAD_CHART_DATA_REQUEST:
      return {
        ...state,
        loading: { ...state.loading, isLoadingChart: true }
      };
      
    case LOAD_CHART_DATA_SUCCESS:
      return {
        ...state,
        selectedResultData: action.payload,
        loading: { ...state.loading, isLoadingChart: false }
      };
      
    case ADD_TO_HISTORY:
      const newHistory = [action.payload, ...state.history];
      // FIFO: Keep only last 100 entries
      return {
        ...state,
        history: newHistory.slice(0, MAX_HISTORY_ENTRIES)
      };
      
    case ADD_TO_TRIALS:
      const newTrials = [action.payload, ...state.trials];
      // FIFO: Keep only last 100 entries
      return {
        ...state,
        trials: newTrials.slice(0, MAX_HISTORY_ENTRIES)
      };
      
    case CLEAR_HISTORY:
      return {
        ...state,
        history: [],
        trials: []
      };
      
    case SET_ERROR:
      return {
        ...state,
        error: {
          message: action.payload.message,
          type: action.payload.type,
          failedRequest: action.payload.failedRequest || null,
          retryCount: state.error.retryCount,
          nextRetryDelay: action.payload.nextRetryDelay || 0
        }
      };
      
    case CLEAR_ERROR:
      return {
        ...state,
        error: initialState.error
      };
      
    case INCREMENT_RETRY_COUNT:
      return {
        ...state,
        error: {
          ...state.error,
          retryCount: state.error.retryCount + 1
        }
      };
      
    case RESET_RETRY_COUNT:
      return {
        ...state,
        error: {
          ...state.error,
          retryCount: 0,
          nextRetryDelay: 0
        }
      };
      
    default:
      return state;
  }
};

// Wrap with persist
export default persistReducer(simulatorPersistConfig, simulatorReducer);
