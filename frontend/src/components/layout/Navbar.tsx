"use client";

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, ChevronDown, LogOut, Package, User, Menu, X, Home, Truck, CheckCircle2, Store, Briefcase } from 'lucide-react';
import SellVehicleModal from '@/components/sell/SellVehicleModal';
import CustomerPrimePaymentModal from '@/components/payments/CustomerPrimePaymentModal';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import SiteBrand from '@/components/layout/SiteBrand';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getPortalMenuLabel, getPortalTarget, getPublicRoleLabel, PORTAL_ROLES } from '@/lib/portal';
import api from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime } from '@/lib/i18n/formatters';

type ProfileResponse = {
  user: {
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
  };
};

export default function Navbar() {
  const { locale, t } = useTranslation();
  const {
    setAuthModalOpen,
    isAuthenticated,
    user,
    token,
    logout,
    hasHydrated,
    hydrateAuth,
  } = useAuthStore();

  const {
    notifications,
    unreadCount,
    initialize,
    fetchRecentListings,
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
  } = useNotificationStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [isPrimePaymentOpen, setIsPrimePaymentOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const lastScrollYRef = useRef(0);
  const tickingRef = useRef(false);
  const hasBlockingModalOpen = isSellModalOpen || isPrimePaymentOpen;
  const shouldShowNavbar = hasBlockingModalOpen || isNavbarVisible;

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (hasBlockingModalOpen) {
      return;
    }

    lastScrollYRef.current = window.scrollY;

    const updateNavbarVisibility = () => {
      const currentScrollY = window.scrollY;
      const previousScrollY = lastScrollYRef.current;
      const scrollDelta = currentScrollY - previousScrollY;

      if (currentScrollY <= 80) {
        setIsNavbarVisible(true);
      } else if (scrollDelta > 4) {
        setIsNavbarVisible(false);
      } else if (scrollDelta < -4) {
        setIsNavbarVisible(true);
      }

      lastScrollYRef.current = currentScrollY;
      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (tickingRef.current) {
        return;
      }

      tickingRef.current = true;
      window.requestAnimationFrame(updateNavbarVisibility);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasBlockingModalOpen]);

  useEffect(() => {
    if (!hasHydrated) {
      hydrateAuth();
    }
  }, [hasHydrated, hydrateAuth]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !token || !user) {
      return;
    }

    let cancelled = false;

    const syncAuthenticatedUser = async () => {
      if (user.role !== 'CUSTOMER') {
        return;
      }

      try {
        const response = await api.get<ProfileResponse>('/auth/profile');
        if (cancelled) {
          return;
        }

        if (response.data?.user) {
          useAuthStore.getState().setAuth(token, {
            ...user,
            ...response.data.user,
          });
        }
      } catch (error) {
        console.error('Failed to sync authenticated user', error);
      }
    };

    void syncAuthenticatedUser();

    const interval = window.setInterval(() => {
      void syncAuthenticatedUser();
    }, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [hasHydrated, isAuthenticated, token, user]);

  useEffect(() => {
    initialize();
    void fetchRecentListings();

    const interval = setInterval(() => {
      void fetchRecentListings();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchRecentListings, initialize]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || user?.role !== 'CUSTOMER') {
      return;
    }

    void fetchNotifications();

    const interval = setInterval(() => {
      void fetchNotifications();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchNotifications, hasHydrated, isAuthenticated, user?.role]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }

      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleDropdown = () => {
    setIsDropdownOpen((current) => !current);
  };

  const displayName = user?.name || user?.email || 'My Account';
  const roleLabel = getPublicRoleLabel({
    role: user?.role,
    partnerType: user?.partnerType,
    isPrimeCustomer: user?.isPrimeCustomer,
  });
  const portalMenuLabel = getPortalMenuLabel(user?.role);
  const portalTarget = getPortalTarget({
    role: user?.role,
    token,
    fallbackPath: user?.portalHomeRoute || '/profile',
  });
  const handlePortalNavigation = () => {
    setIsProfileDropdownOpen(false);

    if (user?.role && PORTAL_ROLES.includes(user.role)) {
      window.location.assign(portalTarget);
      return;
    }
  };

  const handleOpenSellVehicle = () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true);
      return;
    }

    if (user?.role === 'CUSTOMER' && !user?.isPrimeCustomer) {
      setIsPrimePaymentOpen(true);
      return;
    }

    setIsSellModalOpen(true);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-40 w-full bg-white text-gray-900 border-b border-gray-200/80 shadow-xs ${
          hasBlockingModalOpen
            ? 'translate-y-0'
            : `transition-transform duration-300 ease-out will-change-transform ${shouldShowNavbar ? 'translate-y-0' : '-translate-y-full'}`
        }`}
      >
        <div className="w-full px-4 sm:px-6 lg:px-10">
          <div className="flex h-16 sm:h-20 items-center justify-between gap-6">
            {/* Left: Mobile Toggle & Brand Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                className="xl:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <SiteBrand />
            </div>

            {/* Center: Desktop Navigation Links (Single Line - whitespace-nowrap) */}
            <nav className="hidden xl:flex items-center gap-7 lg:gap-9 text-sm font-semibold text-gray-700">
              <Link
                href="/"
                className={`whitespace-nowrap transition-colors hover:text-amber-600 py-1.5 relative ${
                  pathname === '/' ? 'text-amber-600 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 after:rounded-full' : 'hover:text-gray-900'
                }`}
              >
                {t('navbar.home')}
              </Link>
              <Link
                href="/machines"
                className={`whitespace-nowrap transition-colors hover:text-amber-600 py-1.5 relative ${
                  pathname === '/machines' ? 'text-amber-600 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 after:rounded-full' : 'hover:text-gray-900'
                }`}
              >
                {t('navbar.machines')}
              </Link>
              <button
                onClick={handleOpenSellVehicle}
                className="whitespace-nowrap cursor-pointer transition-colors hover:text-amber-600 py-1.5 font-semibold text-gray-700 outline-none hover:text-gray-900"
              >
                {t('navbar.sellVehicle')}
              </button>
              <Link
                href="/sold-vehicles"
                className={`whitespace-nowrap transition-colors hover:text-amber-600 py-1.5 relative ${
                  pathname === '/sold-vehicles' ? 'text-amber-600 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 after:rounded-full' : 'hover:text-gray-900'
                }`}
              >
                {t('navbar.soldVehicles')}
              </Link>
              <Link
                href="/jobs"
                className={`whitespace-nowrap transition-colors hover:text-amber-600 py-1.5 relative ${
                  pathname === '/jobs' || pathname.startsWith('/jobs/') ? 'text-amber-600 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 after:rounded-full' : 'hover:text-gray-900'
                }`}
              >
                Careers
              </Link>
              <Link
                href="/dealers"
                className={`whitespace-nowrap transition-colors hover:text-amber-600 py-1.5 relative ${
                  pathname === '/dealers' ? 'text-amber-600 font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-amber-500 after:rounded-full' : 'hover:text-gray-900'
                }`}
              >
                {t('common.findDealer')}
              </Link>
            </nav>

            {/* Right: Actions (Language Switcher, Notifications, Auth/Profile) */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Language Switcher */}
              <div className="hidden lg:block">
                <LanguageSwitcher tone="light" />
              </div>

              {/* Notification Bell */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={handleToggleDropdown}
                  className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="Open notifications"
                >
                  <Bell className="h-5 w-5 text-gray-700" strokeWidth={2.2} />
                  {isAuthenticated && user?.role === 'CUSTOMER' && unreadCount > 0 ? (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-extrabold text-black ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </button>

                {isDropdownOpen ? (
                  <div className="fixed top-[64px] right-2 left-2 sm:absolute sm:top-auto sm:right-0 sm:left-auto z-50 mt-2 sm:w-88 overflow-hidden rounded-2xl border border-gray-200 bg-white text-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.15)] transition-all duration-200 ease-out">
                    <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-3.5 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-extrabold text-gray-900">{t('common.notifications')}</h3>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-[#FFC107] px-2 py-0.5 text-[10px] font-bold text-black shadow-xs">
                            {unreadCount} {t('common.new', 'new')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {notifications.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => void markAllNotificationsAsRead()}
                            className="text-[11px] font-bold text-amber-700 hover:text-amber-900 transition-colors"
                          >
                            {t('common.markAllRead')}
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(false)}
                          className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                          aria-label="Close notifications"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
                      {!isAuthenticated || user?.role !== 'CUSTOMER' ? (
                        <div className="p-8 text-center text-sm text-gray-500">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                            <Bell className="h-6 w-6" />
                          </div>
                          <p className="font-bold text-gray-900 mb-1">Stay Updated</p>
                          <p className="text-xs text-gray-500">{t('common.loginToViewNotifications')}</p>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-500">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </div>
                          <p className="font-bold text-gray-900 mb-1">All Caught Up!</p>
                          <p className="text-xs text-gray-500">{t('common.noNotifications')}</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <Link
                            href={notification.link || '/machines'}
                            key={notification.id}
                            onClick={() => {
                              void markNotificationAsRead(notification.id);
                              setIsDropdownOpen(false);
                            }}
                            className={`flex items-start gap-3.5 p-3.5 transition-all duration-150 ${
                              !notification.isRead
                                ? 'bg-amber-50/70 border-l-4 border-amber-500 hover:bg-amber-50'
                                : 'bg-white hover:bg-gray-50/80'
                            }`}
                          >
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                              !notification.isRead
                                ? 'bg-amber-100 text-amber-900 border-amber-200'
                                : 'bg-gray-100 text-gray-500 border-gray-200'
                            }`}>
                              <Package size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-xs font-bold truncate ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500"></span>
                                )}
                              </div>
                              <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-gray-600">{notification.message}</p>
                              <div className="mt-1.5 flex items-center justify-between">
                                <p className="text-[10px] font-medium text-gray-400">
                                  {formatDateTime(notification.createdAt, locale)}
                                </p>
                                <span className="text-[10px] font-bold text-amber-700 hover:text-amber-900 flex items-center gap-0.5 transition-colors">
                                  {t('common.viewAll')} &rarr;
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                    {isAuthenticated && user?.role === 'CUSTOMER' && notifications.length > 0 && (
                      <div className="border-t border-gray-100 bg-gray-50/90 px-4 py-2.5 text-center">
                        <Link
                          href="/machines"
                          onClick={() => setIsDropdownOpen(false)}
                          className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
                        >
                          Explore All Machines & Inventory &rarr;
                        </Link>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Profile / Auth Pill Button */}
              {isAuthenticated ? (
                <div className="relative" ref={profileDropdownRef}>
                  <button
                    onClick={() => setIsProfileDropdownOpen((current) => !current)}
                    className="flex items-center gap-2.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 py-1.5 pl-1.5 pr-3.5 transition-colors shadow-2xs"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FFC107] text-sm font-black text-black">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden flex-col items-start sm:flex text-left">
                      <span className="text-xs font-bold text-gray-900 max-w-[120px] truncate leading-tight">{displayName}</span>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-amber-600 leading-tight">
                        {roleLabel}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500 ml-0.5" />
                  </button>

                  {isProfileDropdownOpen ? (
                    <div className="absolute right-0 z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] transition-all duration-200 ease-out">
                      <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4">
                        <p className="truncate text-sm font-bold text-gray-900">{displayName}</p>
                        <p className="mt-0.5 truncate text-xs text-gray-500">{user?.email || 'customer@jcbexchange.com'}</p>
                      </div>
                      <div className="p-1.5">
                        {user?.role && PORTAL_ROLES.includes(user.role) ? (
                          <button
                            type="button"
                            onClick={handlePortalNavigation}
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                          >
                            <User className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                            <span>{portalMenuLabel}</span>
                          </button>
                        ) : (
                          <Link
                            href={portalTarget}
                            onClick={() => setIsProfileDropdownOpen(false)}
                            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                          >
                            <User className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                            <span>{portalMenuLabel}</span>
                          </Link>
                        )}
                        <div className="mx-2 my-1.5 h-px bg-gray-100"></div>
                        <button
                          onClick={logout}
                          className="group flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        >
                          <LogOut className="h-4 w-4 text-red-500 group-hover:text-red-600" />
                          <span>{t('common.logoutSecurely')}</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-xs md:text-sm font-semibold text-gray-800 shadow-2xs transition-all hover:border-gray-300"
                >
                  <User className="h-4 w-4 text-gray-700" strokeWidth={2.2} />
                  <span className="hidden sm:inline">{t('common.loginSignup')}</span>
                  <span className="sm:hidden">{t('common.login')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Backdrop Overlay */}
      {isMobileMenuOpen ? (
        <div
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-xs transition-opacity duration-300 xl:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      ) : null}

      {/* Mobile Slide-Over Navigation Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-[60] flex w-[300px] max-w-[85vw] flex-col bg-white text-gray-900 shadow-2xl transition-transform duration-300 ease-out xl:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="relative flex items-center justify-between border-b border-gray-100 px-5 py-4 min-h-[64px]">
          <SiteBrand />
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile / Auth Card */}
        {isAuthenticated ? (
          <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl bg-gray-50 p-3.5 border border-gray-100">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFC107] font-extrabold text-black text-sm shadow-xs">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-900">{displayName}</p>
                <p className="truncate text-[10px] font-bold text-amber-600 uppercase tracking-wider">{roleLabel}</p>
              </div>
            </div>
            {user?.role && PORTAL_ROLES.includes(user.role) ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handlePortalNavigation();
                }}
                className="rounded-xl bg-gray-200/80 p-2 text-gray-700 hover:bg-gray-300 transition-colors"
                title={portalMenuLabel}
              >
                <User size={16} />
              </button>
            ) : (
              <Link
                href={portalTarget}
                onClick={() => setIsMobileMenuOpen(false)}
                className="rounded-xl bg-gray-200/80 p-2 text-gray-700 hover:bg-gray-300 transition-colors"
                title={portalMenuLabel}
              >
                <User size={16} />
              </Link>
            )}
          </div>
        ) : (
          <div className="mx-4 mt-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setAuthModalOpen(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#FFC107] px-4 py-2.5 text-xs font-extrabold text-black shadow-xs transition hover:bg-[#FFB300]"
            >
              <User size={16} />
              {t('common.loginSignup')}
            </button>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
              pathname === '/' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Home size={18} className={pathname === '/' ? 'text-amber-600' : 'text-gray-400'} />
            <span>{t('navbar.home')}</span>
          </Link>

          <Link
            href="/machines"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
              pathname === '/machines' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Truck size={18} className={pathname === '/machines' ? 'text-amber-600' : 'text-gray-400'} />
            <span>{t('navbar.machines')}</span>
          </Link>

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleOpenSellVehicle();
            }}
            className="w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors text-left"
          >
            <Truck size={18} className="text-gray-400" />
            <span>{t('navbar.sellVehicle')}</span>
          </button>

          <Link
            href="/sold-vehicles"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
              pathname === '/sold-vehicles' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <CheckCircle2 size={18} className={pathname === '/sold-vehicles' ? 'text-amber-600' : 'text-gray-400'} />
            <span>{t('navbar.soldVehicles')}</span>
          </Link>

          <Link
            href="/jobs"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
              pathname === '/jobs' || pathname.startsWith('/jobs/') ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Briefcase size={18} className={pathname === '/jobs' || pathname.startsWith('/jobs/') ? 'text-amber-600' : 'text-gray-400'} />
            <span>Careers</span>
          </Link>

          <Link
            href="/dealers"
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-colors ${
              pathname === '/dealers' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <Store size={18} className={pathname === '/dealers' ? 'text-amber-600' : 'text-gray-400'} />
            <span>{t('common.findDealer')}</span>
          </Link>
        </nav>

        {/* Drawer Footer */}
        <div className="border-t border-gray-100 p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">{t('common.language')}</span>
            <LanguageSwitcher tone="light" direction="up" />
          </div>
          {isAuthenticated && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                logout();
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              <LogOut size={15} />
              {t('common.logoutSecurely')}
            </button>
          )}
        </div>
      </aside>

      {isSellModalOpen ? <SellVehicleModal isOpen={isSellModalOpen} onClose={() => setIsSellModalOpen(false)} /> : null}
      {isPrimePaymentOpen ? (
        <CustomerPrimePaymentModal
          isOpen={isPrimePaymentOpen}
          feature="SELL_LISTING"
          onClose={() => setIsPrimePaymentOpen(false)}
          onAccessGranted={() => {
            setIsPrimePaymentOpen(false);
            setIsSellModalOpen(true);
          }}
        />
      ) : null}
    </>
  );
}
