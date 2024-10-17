import { SET_USER, LOGOUT } from '../actions/authActions';

const getInitialState = () => {
  const token = localStorage.getItem('thebearToken');
  return {
    user: null,
    isAuthenticated: !!token,
    token: token || null,
  };
};

const authReducer = (state = getInitialState(), action) => {
  switch (action.type) {
    case SET_USER:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        token: action.payload.token,
      };
    case LOGOUT:
      localStorage.removeItem('thebearToken');
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        token: null,
      };
    default:
      return state;
  }
};

export default authReducer;
