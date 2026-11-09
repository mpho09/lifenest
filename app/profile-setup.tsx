import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight, KeyRound, UserRound } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/Button';
import { useIsOffline } from '../components/OfflineBanner';
import { PinPad } from '../components/PinPad';
import { TextField } from '../components/TextField';
import { Banner, Card, Header, Row, Screen, SwitchRow, Title } from '../components/ui';
import { getProfile, saveProfile } from '../lib/api/profile';
import { messageForError } from '../lib/errors';
import { acceptStoredInvite } from '../lib/invite';
import { canUseFingerprint } from '../lib/lock/biometrics';
import { savePin } from '../lib/lock/pin';
import { labels, messages } from '../lib/messages';
import { isValidSaPhone } from '../lib/rules/contact';
import { useSession } from '../lib/session';
import { tokens } from '../theme/tokens';

/**
 * S5 Profile Setup (docs/designs/S5.png): full name, optional phone, a 6-digit
 * PIN entered twice, and an optional fingerprint switch. `?mode=pin` is
 * "Change PIN" from S18 (PIN part only).
 */
export default function ProfileSetup() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const changingPin = mode === 'pin';
  const { userId, reloadPin, unlock } = useSession();
  const offline = useIsOffline();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);
  const [errorCount, setErrorCount] = useState(0);
  const [fingerprintAvailable, setFingerprintAvailable] = useState(false);
  const [fingerprint, setFingerprint] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    canUseFingerprint().then(setFingerprintAvailable);
    if (!changingPin) {
      getProfile()
        .then((p) => {
          if (p.full_name) setFullName(p.full_name);
          if (p.phone) setPhone(p.phone);
        })
        .catch(() => {});
    }
  }, [changingPin]);

  const onPin = (pin: string) => {
    setPinError(null);
    if (!firstPin) {
      setFirstPin(pin);
      return;
    }
    if (pin === firstPin) {
      setConfirmed(pin);
    } else {
      setFirstPin(null);
      setPinError(messages.pinMismatch);
      setErrorCount((c) => c + 1);
    }
  };

  const nameOk = changingPin || fullName.trim().length >= 2;
  const phoneOk = changingPin || isValidSaPhone(phone);
  const canFinish = !!confirmed && nameOk && phoneOk && !busy && (changingPin || !offline);

  const done = async () => {
    if (!userId || !confirmed) return;
    setBusy(true);
    setError(null);
    try {
      if (!changingPin) await saveProfile(fullName, phone);
      await savePin(userId, confirmed, fingerprint);
      if (!changingPin) await acceptStoredInvite();
      await reloadPin();
      if (changingPin) {
        router.back();
      } else {
        unlock('/');
      }
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(false);
    }
  };

  const pinStep = confirmed ? 'done' : firstPin ? 'confirm' : 'create';

  return (
    <Screen width="narrow">
      {changingPin ? <Header /> : null}
      <Title subtitle={changingPin ? undefined : 'Add a few details and a PIN to protect your LifeNest account.'}>
        {changingPin ? labels.changePin : 'Let’s set up your vault.'}
      </Title>
      {error ? <Banner tone="error" text={error} /> : null}

      {!changingPin ? (
        <Card>
          <Row>
            <UserRound color={tokens.color.primary} size={20} />
            <Text style={styles.cardTitle}>Your details</Text>
          </Row>
          <TextField
            label={labels.fullName}
            value={fullName}
            onChangeText={setFullName}
            maxLength={80}
            autoComplete="name"
            testID="profile-full-name"
          />
          <TextField
            label={labels.phone}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
            placeholder="082 123 4567"
            error={phone && !phoneOk ? 'Use a South African number, e.g. 082 123 4567.' : undefined}
          />
        </Card>
      ) : null}

      <Card>
        <Row>
          <KeyRound color={tokens.color.primary} size={20} />
          <Text style={styles.cardTitle}>
            {pinStep === 'create' ? 'Create a 6-digit PIN' : pinStep === 'confirm' ? 'Enter the same PIN again' : 'PIN set'}
          </Text>
        </Row>
        {pinError ? <Banner tone="error" text={pinError} /> : null}
        {pinStep === 'done' ? (
          <Banner
            tone="success"
            text="Your PIN is set. It is stored only on this device."
            actionLabel="Change"
            onAction={() => {
              setConfirmed(null);
              setFirstPin(null);
            }}
          />
        ) : (
          <View style={styles.pad}>
            <PinPad key={pinStep} onComplete={onPin} errorCount={errorCount} />
          </View>
        )}
      </Card>

      {fingerprintAvailable ? (
        <Card>
          <SwitchRow label={labels.fingerprint} value={fingerprint} onChange={setFingerprint} />
        </Card>
      ) : null}

      <Button
        title={labels.done}
        onPress={done}
        disabled={!canFinish}
        loading={busy}
        trailingIcon={<ArrowRight color={tokens.color.surface} size={20} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: { ...tokens.font.button, color: tokens.color.text },
  pad: { alignItems: 'center', paddingVertical: tokens.space[4] },
});
