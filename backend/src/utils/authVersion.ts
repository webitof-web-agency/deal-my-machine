export const isAuthVersionCurrent = ({
  tokenVersion,
  databaseVersion,
}: {
  tokenVersion?: number | undefined;
  databaseVersion: number;
}) =>
  (tokenVersion === undefined && databaseVersion === 0) ||
  (typeof tokenVersion === 'number' && tokenVersion === databaseVersion);
