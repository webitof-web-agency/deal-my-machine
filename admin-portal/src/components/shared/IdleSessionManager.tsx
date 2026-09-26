'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Clock3 } from 'lucide-react';
import { useIdleLogout } from '@/hooks/useIdleLogout';
import { useAuthStore } from '@/store/authStore';

export default function IdleSessionManager() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuthStore();
  const handleLogout = useCallback(() => {
    logout();
    router.replace('/login');
  }, [logout, router]);
  const { isWarningVisible, continueSession } = useIdleLogout({ enabled: isAuthenticated, onLogout: handleLogout });

  if (!isWarningVisible) return null;

  return (
    <div className="fixed inset-x-4 bottom-4 z-[100000] mx-auto flex max-w-xl items-center gap-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-2xl" role="alert">
      <Clock3 className="hidden shrink-0 text-amber-700 sm:block" size={24} />
      <p className="flex-1 text-sm font-semibold">Your session will expire soon because of inactivity.</p>
      <button type="button" onClick={continueSession} className="shrink-0 rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white hover:bg-amber-700">
        Continue session
      </button>
    </div>
  );
}
