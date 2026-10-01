import { create } from 'zustand';
import { AUTH_CHANGE_EVENT, LEGACY_AUTH_CHANGE_EVENT } from '@/lib/storageKeys';
import {
  AUTH_TOKEN_KEY,
  AUTH_USER_KEY,
  getAuthStorageName,
  persistAuth,
} from '@/lib/authPersistence.mjs';

export interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
  rawRole?: string;
  status?: string | null;
  ownerName?: string | null;
  onboardingStatus?: string | null;
  accountStatus?: string | null;
  kycStatus?: string | null;
  partnerType?: string | null;
  businessAddress?: string | null;
  district?: string | null;
  pinCode?: string | null;
  contactPreference?: string | null;
  city?: string | null;
  state?: string | null;
  mobile?: string | null;
  whatsappNumber?: string | null;
  isVerifiedPartner?: boolean;
  isPrimeCustomer?: boolean;
  customerCategory?: string | null;
  primeSubscriptionExpiresAt?: string | null;
  portalHomeRoute?: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  hasHydrated: boolean;
  hydrateAuth: () => void;
  setAuth: (token: string, user: AuthUser, rememberMe?: boolean) => void;
  setAuthModalOpen: (isOpen: boolean) => void;
  logout: () => void;
}

const getStorageValue = (storage: Storage, key: string) => storage.getItem(key);

const isUsableAuthToken = (token: string | null) => {
  if (!token) {
    return false;
  }

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return false;
    }

    const normalizedPayload = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(paddedPayload)) as { exp?: unknown };

    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

const dispatchAuthChange = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(AUTH_CHANGE_EVENT));
  window.dispatchEvent(new CustomEvent(LEGACY_AUTH_CHANGE_EVENT));
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  hasHydrated: false,
  hydrateAuth: () => {
    if (typeof window !== 'undefined') {
      const storages = [window.localStorage, window.sessionStorage];

      for (const storage of storages) {
        const token = getStorageValue(storage, AUTH_TOKEN_KEY);
        const storedUser = getStorageValue(storage, AUTH_USER_KEY);
        let user: AuthUser | null = null;

        try {
          user = storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
        } catch {
          user = null;
        }

        if (isUsableAuthToken(token) && user) {
          set({
            token,
            user,
            isAuthenticated: true,
            hasHydrated: true,
          });
          return;
        }
      }

      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      window.sessionStorage.removeItem(AUTH_USER_KEY);
    }

    set({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
    });
  },
  setAuth: (token, user, rememberMe) => {
    if (typeof window !== 'undefined') {
      const storageName = rememberMe === undefined
        ? (window.sessionStorage.getItem(AUTH_TOKEN_KEY) === token ? 'session' : 'local')
        : getAuthStorageName(rememberMe);
      persistAuth(window.localStorage, window.sessionStorage, token, user, storageName === 'local');
    }

    dispatchAuthChange();
    set({
      token,
      user,
      isAuthenticated: true,
      hasHydrated: true,
      isAuthModalOpen: false,
    });
  },
  setAuthModalOpen: (isOpen) => set({ isAuthModalOpen: isOpen }),
  logout: () => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_TOKEN_KEY);
      window.localStorage.removeItem(AUTH_USER_KEY);
      window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
      window.sessionStorage.removeItem(AUTH_USER_KEY);
    }
    dispatchAuthChange();
    set({
      token: null,
      user: null,
      isAuthenticated: false,
      hasHydrated: true,
      isAuthModalOpen: false,
    });
  },
}));
