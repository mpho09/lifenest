import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Logo } from '../components/Logo';
import { PinPad } from '../components/PinPad';
import { Banner, LinkButton, Screen, Title } from '../components/ui';
import { logOut } from '../lib/api/auth';
import { getProfile } from '../lib/api/profile';
import { getMyOpenRequest } from '../lib/api/vault';
import { canUseFingerprint, unlockWithFingerprint } from '../lib/lock/biometrics';
import { deletePin, MAX_PIN_ATTEMPTS, verifyPin } from '../lib/lock/pin';
import { lockStorage } from '../lib/lock/storage';
import { labels, messages } from '../lib/messages';
import { useSession } from '../lib/session';
import { tokens } from '../theme/tokens';

const attemptsKey = (userId: string) => `lifenest_pin_attempts_${userId}`;

/** S6 Unlock (docs/designs/S6.png): PIN or fingerprint; 5 wrong PINs log the user out (BR9). */
export default function Unlock() {
  const { userId, pin, unlock } = useSession();
  const [firstName, setFirstName] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [fingerprint, setFingerprint] = useState(false);

  useEffect(() => {
    if (!userId) return;
    lockStorage.get(attemptsKey(userId)).then((v) => setAttempts(Number(v ?? 0)));
    getProfile()
      .then((p) => setFirstName(p.full_name?.split(' ')[0] ?? null))
      .catch(() => {});
    if (pin?.fingerprint) canUseFingerprint().then(setFingerprint);
  }, [userId, pin?.fingerprint]);

  // T-US12-1 / T-NAV-2: S21 first when my vault has an open request or a release.
  const finishUnlock = async () => {
    if (userId) await lockStorage.remove(attemptsKey(userId));
    let target = '/';
    try {
      const open = await getMyOpenRequest();
      if (open && ['submitted', 'verified', 'released'].includes(open.status)) target = '/access-alert';
    } catch {
      // Offline: go home; the alert shows when online.
    }
    unlock(target);
  };

  const signOutAndForget = async (notice?: string) => {
    if (userId) {
      await deletePin(userId);
      await lockStorage.remove(attemptsKey(userId));
    }
    await logOut();
    router.replace(notice ? { pathname: '/log-in', params: { notice } } : '/log-in');
  };

  const onPin = async (entered: string) => {
    if (!pin || !userId) return;
    if (await verifyPin(entered, pin)) {
      await finishUnlock();
      return;
    }
    const next = attempts + 1;
    setAttempts(next);
    setErrorCount((c) => c + 1);
    await lockStorage.set(attemptsKey(userId), String(next));
    if (next >= MAX_PIN_ATTEMPTS) {
      setMessage(messages.tooManyPins);
      await signOutAndForget('pins');
      return;
    }
    setMessage(messages.wrongPin(MAX_PIN_ATTEMPTS - next));
  };

  const onFingerprint = async () => {
    if (await unlockWithFingerprint()) await finishUnlock();
  };

  return (
    <Screen>
      <View style={styles.top}>
        <Logo />
      </View>
      <Title subtitle="Enter your 6-digit PIN.">{firstName ? `Welcome back, ${firstName}` : 'Welcome back'}</Title>
      {message ? <Banner tone="error" text={message} /> : null}
      <View style={styles.pad}>
        <PinPad onComplete={onPin} errorCount={errorCount} showFingerprint={fingerprint} onFingerprint={onFingerprint} />
      </View>
      <View style={styles.center}>
        <LinkButton label={labels.forgotPin} onPress={() => signOutAndForget()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'center', paddingTop: tokens.space[4] },
  pad: { alignItems: 'center' },
  center: { alignItems: 'center' },
});
