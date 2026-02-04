import { combineReducers } from 'redux';
import authReducer from './authReducers';
import simulatorReducer from './simulatorReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  simulator: simulatorReducer,
  // ... other reducers ...
});

export default rootReducer;

