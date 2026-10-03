export const buildAuthTokenPayload = (user: {
  id: string;
  email?: string | null;
  role: string;
  status?: string | null;
  authVersion?: number | null;
}) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  rawRole: user.role,
  status: user.status,
  authVersion: user.authVersion ?? 0,
});
