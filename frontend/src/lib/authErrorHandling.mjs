const AUTH_FAILURE_CODES = new Set(['ACCOUNT_REVOKED', 'ACCOUNT_INACTIVE']);

const hasAuthorizationHeader = (error) => {
  const headers = error?.config?.headers;
  return Boolean(headers?.Authorization || headers?.authorization);
};

export const shouldResetAuthSession = (error) => {
  if (!hasAuthorizationHeader(error)) {
    return false;
  }

  const status = error?.response?.status;
  if (status === 401) {
    return true;
  }

  return status === 403 && AUTH_FAILURE_CODES.has(error?.response?.data?.code);
};
