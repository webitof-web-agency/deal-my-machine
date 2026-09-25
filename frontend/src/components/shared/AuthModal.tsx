"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { X, Mail, Lock, User, Eye, EyeOff, Smartphone } from 'lucide-react';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import SiteBrand from '@/components/layout/SiteBrand';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: Record<string, string | number | boolean>
          ) => void;
        };
      };
    };
  }
}

type AuthResponseUser = {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string;
};

type MobileOtpConfigResponse = {
  enabled: boolean;
};

export default function AuthModal() {
  const { t } = useTranslation();
  const { isAuthModalOpen, setAuthModalOpen, setAuth } = useAuthStore();
  const showToast = useToastStore((state) => state.showToast);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  const [isOtpVerifying, setIsOtpVerifying] = useState(false);
  const [isMobileOtpEnabled, setIsMobileOtpEnabled] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpChallengeId, setOtpChallengeId] = useState('');
  const [otpMaskedMobile, setOtpMaskedMobile] = useState('');
  const [googleClientId, setGoogleClientId] = useState<string | null>(null);
  const [isGoogleScriptReady, setIsGoogleScriptReady] = useState(
    typeof window !== 'undefined' && !!window.google
  );
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const googleInitializedRef = useRef(false);

  const isGoogleConfigured =
    !!googleClientId && !googleClientId.startsWith('YOUR_');
  const canRenderGoogleLogin = isGoogleConfigured;

  const showLoginSuccessToast = useCallback((userName?: string | null, email?: string | null) => {
    const displayName = userName?.trim() || email?.split('@')[0] || 'User';
    showToast({
      title: `Welcome back, ${displayName}! 👋`,
      description: `Logged in successfully. Explore active JCB and heavy equipment listings.`,
      variant: 'success',
    });
  }, [showToast]);

  const completeAuth = useCallback((token: string, user: AuthResponseUser, shouldNotify = true) => {
    setAuth(token, user);
    setAuthModalOpen(false);
    if (shouldNotify) {
      showLoginSuccessToast(user.name, user.email);
    }
  }, [setAuth, setAuthModalOpen, showLoginSuccessToast]);

  const handleGoogleCredential = useCallback(async (credential?: string) => {
    if (!credential) {
      setError(t('auth.googleCredentialMissing'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/google', { credential });
      const { token, user } = response.data as { token: string; user: AuthResponseUser };
      completeAuth(token, user, true);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.error ||
            (err as { response?: { data?: { error?: string; message?: string } } }).response?.data?.message ||
            t('auth.googleLoginFailed')
          : t('auth.googleLoginFailed');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [completeAuth, t]);

  useEffect(() => {
    let cancelled = false;

    const loadGoogleConfig = async () => {
      try {
        const [googleResponse, otpConfigResponse] = await Promise.all([
          api.get<{ enabled: boolean; clientId: string | null }>('/auth/google-config'),
          api.get<MobileOtpConfigResponse>('/auth/mobile-otp/config'),
        ]);

        if (!cancelled) {
          setGoogleClientId(googleResponse.data.enabled ? googleResponse.data.clientId : null);
          setIsMobileOtpEnabled(otpConfigResponse.data.enabled === true);
        }
      } catch {
        if (!cancelled) {
          setGoogleClientId(null);
          setIsMobileOtpEnabled(false);
        }
      }
    };

    void loadGoogleConfig();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAuthModalOpen) {
      googleInitializedRef.current = false;
      return;
    }

    if (
      !canRenderGoogleLogin ||
      !isGoogleScriptReady ||
      !window.google ||
      !googleButtonRef.current
    ) {
      return;
    }

    if (googleInitializedRef.current && googleButtonRef.current.childElementCount > 0) {
      return;
    }

    googleButtonRef.current.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        void handleGoogleCredential(response.credential);
      },
    });

    window.google.accounts.id.renderButton(googleButtonRef.current, {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      width: 320,
    });

    googleInitializedRef.current = true;
  }, [
    googleClientId,
    handleGoogleCredential,
    isAuthModalOpen,
    canRenderGoogleLogin,
    isGoogleScriptReady,
  ]);

  const handleAuthModeChange = () => {
    setIsLogin((current) => !current);
    setLoginMethod('password');
    setOtpChallengeId('');
    setOtpMaskedMobile('');
    setOtp('');
    setError('');
  };

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        const { token, user } = response.data as { token: string; user: AuthResponseUser };
        completeAuth(token, user, true);
      } else {
        if (password.length < 8) {
          setError(t('auth.passwordLength'));
          setIsSubmitting(false);
          return;
        }

        if (!email.includes('@')) {
          setError(t('auth.validEmail'));
          setIsSubmitting(false);
          return;
        }

        if (mobile.replace(/\D/g, '').length !== 10) {
          setError(t('auth.validMobile'));
          setIsSubmitting(false);
          return;
        }

        const response = await api.post('/auth/register', { email, password, name, mobile });
        const { token, user } = response.data as { token: string; user: AuthResponseUser };
        completeAuth(token, user);
      }
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            t('auth.authFailed')
          : t('auth.authFailed');
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsOtpSending(true);

    try {
      if (mobile.replace(/\D/g, '').length !== 10) {
        setError(t('auth.validMobile'));
        setIsOtpSending(false);
        return;
      }

      const response = await api.post('/auth/login/mobile-otp/send', { mobile });
      setOtpChallengeId(response.data.challengeId || '');
      setOtpMaskedMobile(response.data.maskedMobile || '');
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            t('auth.sendOtpFailed')
          : t('auth.sendOtpFailed');
      setError(errorMessage);
    } finally {
      setIsOtpSending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsOtpVerifying(true);

    try {
      const response = await api.post('/auth/login/mobile-otp/verify', {
        challengeId: otpChallengeId,
        mobile,
        otp,
      });
      const { token, user } = response.data as { token: string; user: AuthResponseUser };
      completeAuth(token, user, true);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
            t('auth.verifyOtpFailed')
          : t('auth.verifyOtpFailed');
      setError(errorMessage);
    } finally {
      setIsOtpVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#05070b]/55 px-3 py-4 backdrop-blur-[2px] sm:px-4">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setIsGoogleScriptReady(true)}
      />
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-[390px] overflow-hidden rounded-[4px] border border-[#d9dde3] bg-white shadow-[0_18px_55px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in duration-200">
          <div className="relative flex min-h-[78px] items-center justify-center border-b border-[#edf0f3] bg-white px-8 py-3">
            <SiteBrand variant="navbar" align="center" />
            <button
              onClick={() => setAuthModalOpen(false)}
              aria-label="Close login"
              className="absolute right-3 top-2 flex h-8 w-8 items-center justify-center rounded-full text-[#7d8792] transition-colors hover:bg-[#f3f4f6] hover:text-[#111827] focus:outline-none focus:ring-2 focus:ring-jcb-yellow"
            >
              <X size={17} strokeWidth={1.8} />
            </button>
          </div>

          <div className="px-5 pb-5 pt-4 sm:px-7 sm:pb-6 sm:pt-5">
            <div className="mb-4 text-center">
              <h4 className="text-[21px] font-extrabold tracking-[-0.02em] text-[#101828]">
                {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
              </h4>
              <p className="mt-1 text-[11px] leading-4 text-[#667085]">
                {isLogin ? 'Login to continue buying and selling machines' : 'Create your account to get started'}
              </p>
            </div>

            {error ? (
              <div role="alert" className="mb-3 rounded-md border border-red-100 bg-red-50 p-2.5 text-center text-xs font-semibold text-red-600">
                {error}
              </div>
            ) : null}

          <form
            onSubmit={isLogin && loginMethod === 'otp' ? (otpChallengeId ? handleVerifyOtp : handleSendOtp) : handleSubmit}
            className="space-y-2.5"
          >
            {!isLogin ? (
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-[#344054]">{t('auth.fullName')}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block h-10 w-full rounded-[4px] border border-[#d0d5dd] bg-white px-3 py-2 pl-9 text-xs text-[#101828] outline-none transition-shadow placeholder:text-[#98a2b3] focus:border-[#fdbb05] focus:ring-2 focus:ring-[#fdbb05]/20"
                    placeholder={t('auth.fullName')}
                    required={!isLogin}
                  />
                  <User className="absolute left-3 top-3 text-[#98a2b3]" size={14} />
                </div>
              </div>
            ) : null}

            {isLogin && isMobileOtpEnabled && loginMethod === 'otp' ? (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#344054]">{t('auth.mobileNumber')}</label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="block h-10 w-full rounded-[4px] border border-[#d0d5dd] bg-white px-3 py-2 pl-9 text-xs text-[#101828] outline-none transition-shadow placeholder:text-[#98a2b3] focus:border-[#fdbb05] focus:ring-2 focus:ring-[#fdbb05]/20"
                      placeholder={t('auth.mobileNumber')}
                      required
                    />
                    <Smartphone className="absolute left-3 top-3 text-[#98a2b3]" size={14} />
                  </div>
                </div>

                {otpChallengeId ? (
                  <div>
                    <label className="mb-1 block text-[11px] font-semibold text-[#344054]">{t('auth.otp')}</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="block h-10 w-full rounded-[4px] border border-[#d0d5dd] bg-white px-3 py-2 text-xs tracking-[0.2em] text-[#101828] outline-none transition-shadow placeholder:text-[#98a2b3] focus:border-[#fdbb05] focus:ring-2 focus:ring-[#fdbb05]/20"
                        placeholder={t('auth.otp')}
                        required
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-[#667085]">
                      {t('auth.otpSentTo', { mobile: otpMaskedMobile || t('auth.mobileNumber').toLowerCase() })}
                    </p>
                  </div>
                ) : null}
              </>
            ) : (
              <>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#344054]">{t('auth.emailAddress')}</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block h-10 w-full rounded-[4px] border border-[#d0d5dd] bg-white px-3 py-2 pl-9 text-xs text-[#101828] outline-none transition-shadow placeholder:text-[#98a2b3] focus:border-[#fdbb05] focus:ring-2 focus:ring-[#fdbb05]/20"
                      placeholder="you@example.com"
                      required
                    />
                    <Mail className="absolute left-3 top-3 text-[#98a2b3]" size={14} />
                  </div>
                </div>

                {!isLogin ? (
                  <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#344054]">{t('auth.mobileNumber')}</label>
                    <div className="relative">
                      <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="block h-10 w-full rounded-[4px] border border-[#d0d5dd] bg-white px-3 py-2 pl-9 text-xs text-[#101828] outline-none transition-shadow placeholder:text-[#98a2b3] focus:border-[#fdbb05] focus:ring-2 focus:ring-[#fdbb05]/20"
                        placeholder={t('auth.mobileNumber')}
                        required
                      />
                      <Smartphone className="absolute left-3 top-3 text-[#98a2b3]" size={14} />
                    </div>
                  </div>
                ) : null}

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#344054]">{t('auth.password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block h-10 w-full rounded-[4px] border border-[#d0d5dd] bg-white px-3 py-2 pl-9 pr-10 text-xs text-[#101828] outline-none transition-shadow placeholder:text-[#98a2b3] focus:border-[#fdbb05] focus:ring-2 focus:ring-[#fdbb05]/20"
                      placeholder="********"
                      required
                    />
                    <Lock className="absolute left-3 top-3 text-[#98a2b3]" size={14} />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-2.5 rounded p-0.5 text-[#98a2b3] hover:text-[#344054] focus:outline-none focus:ring-2 focus:ring-jcb-yellow/40"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}



            <div className="space-y-2.5 pt-2">
              {isLogin && loginMethod === 'password' ? (
                <div className="flex items-center justify-between pb-0.5 text-[10px]">
                  <label className="flex items-center gap-1.5 text-[#667085]">
                    <input type="checkbox" defaultChecked className="h-3 w-3 accent-[#fdbb05]" />
                    Remember me
                  </label>
                  <span className="font-semibold text-[#f29f05]">Forgot Password?</span>
                </div>
              ) : null}
              <button
                type="submit"
                disabled={isSubmitting || isOtpSending || isOtpVerifying}
                className="flex h-10 w-full justify-center rounded-[4px] border border-transparent bg-[#fdbb05] px-4 py-2.5 text-xs font-extrabold text-[#101828] shadow-sm transition-colors hover:bg-[#f5ad00] focus:outline-none focus:ring-2 focus:ring-[#fdbb05] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLogin && loginMethod === 'otp'
                  ? otpChallengeId
                    ? isOtpVerifying
                      ? `${t('auth.verifyOtpAndLogin')}...`
                      : t('auth.verifyOtpAndLogin')
                    : isOtpSending
                      ? t('auth.sendingOtp')
                      : t('auth.sendOtp')
                  : isSubmitting
                    ? t('auth.pleaseWait')
                    : isLogin
                      ? t('auth.loginToAccount')
                      : t('auth.createAccount')}
              </button>

              {isLogin && loginMethod === 'otp' && otpChallengeId ? (
                <button
                  type="button"
                  onClick={() => {
                    setOtpChallengeId('');
                    setOtpMaskedMobile('');
                    setOtp('');
                    setError('');
                  }}
                  className="w-full text-xs font-semibold text-[#344054] hover:underline"
                >
                  {t('auth.changeMobileNumber')}
                </button>
              ) : null}

              {isLogin && isMobileOtpEnabled ? (
                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod(loginMethod === 'password' ? 'otp' : 'password');
                    setError('');
                    if (loginMethod === 'otp') {
                      setOtpChallengeId('');
                      setOtpMaskedMobile('');
                      setOtp('');
                    }
                  }}
                  className="flex h-10 w-full justify-center rounded-[4px] border border-[#d0d5dd] bg-white px-4 py-2.5 text-xs font-bold text-[#344054] shadow-sm transition-colors hover:bg-[#f9fafb] focus:outline-none focus:ring-2 focus:ring-[#d0d5dd]"
                >
                  {loginMethod === 'password' ? t('auth.loginWithOtp') : t('auth.loginWithPassword')}
                </button>
              ) : null}
            </div>
          </form>

          {canRenderGoogleLogin ? (
            <>
              <div className="relative my-3.5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-[10px]">
                  <span className="bg-white px-2 text-[#98a2b3]">{t('auth.orContinueWithGoogle')}</span>
                </div>
              </div>

              <div className="mb-4">
                <div className="space-y-2">
                  <div ref={googleButtonRef} className="flex min-h-[40px] items-center justify-center overflow-hidden [&>div]:max-w-full" />
                  {!isGoogleScriptReady ? (
                    <p className="text-center text-[10px] text-[#667085]">{t('auth.loadingGoogleLogin')}</p>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          <div className="mt-3 text-center text-[10px] text-[#667085]">
            {isLogin ? `${t('auth.dontHaveAccount')} ` : `${t('auth.alreadyHaveAccount')} `}
            <button
              type="button"
              onClick={handleAuthModeChange}
              className="font-bold text-[#f29f05] hover:underline focus:outline-none focus:ring-2 focus:ring-[#fdbb05]/40"
            >
              {isLogin ? t('auth.signUp') : t('auth.logIn')}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
