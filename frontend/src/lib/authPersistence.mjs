export const AUTH_TOKEN_KEY = 'frontend_portal_token';
export const AUTH_USER_KEY = 'frontend_portal_user';

export const getAuthStorageName = (rememberMe) => (rememberMe ? 'local' : 'session');

export const persistAuth = (localStorage, sessionStorage, token, user, rememberMe) => {
  const targetStorage = getAuthStorageName(rememberMe) === 'local' ? localStorage : sessionStorage;
  const otherStorage = targetStorage === localStorage ? sessionStorage : localStorage;

  otherStorage.removeItem(AUTH_TOKEN_KEY);
  otherStorage.removeItem(AUTH_USER_KEY);
  targetStorage.setItem(AUTH_TOKEN_KEY, token);
  targetStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
};
