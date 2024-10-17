export const SET_USER = 'SET_USER';
export const LOGOUT = 'LOGOUT';

export const setUser = (user, token) => ({
  type: SET_USER,
  payload: { user, token },
});

export const logout = () => ({
  type: LOGOUT,
});
