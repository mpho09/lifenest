import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { shouldLockAfterBackground } from './lock/lockTimer';
import { loadPinRecord, type PinRecord } from './lock/pin';
import { clearSessionStart, getSessionStart, isSessionTooOld } from './lock/session';
import { supabase } from './supabase';

type SessionState = {
  ready: boolean;
  session: Session | null;
  userId: string | null;
  pin: PinRecord | null;
  unlocked: boolean;
  /** True after a password-reset link: stay on S4 until the new password is saved (Section 11). */
  recovery: boolean;
  /** Where to go right after unlocking (S21 first when there is an open request or release). */
  afterUnlock: string;
  unlock: (target?: string) => void;
  lock: () => void;
  reloadPin: () => Promise<void>;
  endRecovery: () => void;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [pin, setPin] = useState<PinRecord | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [afterUnlock, setAfterUnlock] = useState('/');
  const backgroundedAt = useRef<number | null>(null);

  const userId = session?.user.id ?? null;

  const reloadPin = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const id = data.session?.user.id;
    setPin(id ? await loadPinRecord(id) : null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      let current = data.session;
      // Section 18 #6: sign out on start when the login is older than 30 days.
      if (current && isSessionTooOld(await getSessionStart(), Date.now())) {
        await supabase.auth.signOut();
        await clearSessionStart();
        current = null;
      }
      if (!active) return;
      setSession(current);
      setPin(current ? await loadPinRecord(current.user.id) : null);
      setReady(true);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
      if (event === 'SIGNED_OUT') {
        setUnlocked(false);
        setPin(null);
      }
      if (event === 'SIGNED_IN' && next) {
        loadPinRecord(next.user.id).then(setPin);
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // BR9: lock after more than 5 minutes in the background.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (shouldLockAfterBackground(backgroundedAt.current, Date.now())) setUnlocked(false);
        backgroundedAt.current = null;
      } else if (backgroundedAt.current === null) {
        backgroundedAt.current = Date.now();
      }
    });
    return () => sub.remove();
  }, []);

  const unlock = useCallback((target = '/') => {
    setAfterUnlock(target);
    setUnlocked(true);
  }, []);
  const lock = useCallback(() => setUnlocked(false), []);
  const endRecovery = useCallback(() => setRecovery(false), []);

  const value = useMemo(
    () => ({ ready, session, userId, pin, unlocked, recovery, afterUnlock, unlock, lock, reloadPin, endRecovery }),
    [ready, session, userId, pin, unlocked, recovery, afterUnlock, unlock, lock, reloadPin, endRecovery],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside SessionProvider');
  return ctx;
}

/** Section 11 redirect rule, as a pure function so it can be tested (T-NAV-1). */
export function redirectFor(state: {
  ready: boolean;
  loggedIn: boolean;
  hasPin: boolean;
  unlocked: boolean;
  recovery: boolean;
  area: 'public' | 'invite' | 'setup' | 'unlock' | 'reset' | 'app';
  changingPin: boolean;
  afterUnlock: string;
}): string | null {
  const { ready, loggedIn, hasPin, unlocked, recovery, area } = state;
  if (!ready) return null;
  if (recovery && area === 'reset') return null;
  if (!loggedIn) return area === 'public' || area === 'reset' || area === 'invite' ? null : '/welcome';
  if (area === 'invite') return null;
  if (!hasPin) return area === 'setup' ? null : '/profile-setup';
  if (!unlocked) return area === 'unlock' ? null : '/unlock';
  if (area === 'setup' && state.changingPin) return null;
  if (area === 'public' || area === 'reset' || area === 'unlock' || area === 'setup') return state.afterUnlock;
  return null;
}
