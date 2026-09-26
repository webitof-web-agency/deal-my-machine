const ONE_MINUTE_MS = 60 * 1000;
const DEFAULT_IDLE_TIMEOUT_MINUTES = 15;

export const getIdleTimeoutMs = (rawMinutes) => {
  const minutes = Number(rawMinutes);
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : DEFAULT_IDLE_TIMEOUT_MINUTES;
  return safeMinutes * 60 * 1000;
};

export const getWarningAtMs = (timeoutMs) => Math.max(0, timeoutMs - ONE_MINUTE_MS);

export const getInitialActivityAt = (now) => now;

export const isIdleExpired = (lastActivityAt, now, timeoutMs) => now - lastActivityAt >= timeoutMs;
