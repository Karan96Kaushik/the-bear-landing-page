import storage from 'redux-persist/lib/storage';

// Configuration flag to control what gets persisted
// Set to 'full' to persist entire simulator state, 'history' to persist only history/trials
const PERSIST_SIMULATION_CONFIG = 'full';

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['simulator'], // Persist simulator state
  version: 1,
};

// Nested persist config for simulator reducer
export const simulatorPersistConfig = {
  key: 'simulator',
  storage,
  whitelist: PERSIST_SIMULATION_CONFIG === 'full' 
    ? ['config', 'history', 'trials', 'results', 'pollingState']
    : ['history', 'trials'],
  version: 1,
};

export default persistConfig;
