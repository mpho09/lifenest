import { router, useLocalSearchParams } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { useIsOffline } from '../../components/OfflineBanner';
import { TextField } from '../../components/TextField';
import { Banner, Card, Header, LinkButton, Screen, Title } from '../../components/ui';
import { exchangeResetCode, logOut, requestPasswordReset, setNewPassword } from '../../lib/api/auth';
import { labels, messages } from '../../lib/messages';
import { isValidEmail, isValidPassword } from '../../lib/rules/password';
import { useSession } from '../../lib/session';
import { tokens } from '../../theme/tokens';

/**
 * S4 Forgot Password (docs/designs/S4.png). Request mode sends a reset link;
 * set-new-password mode opens from that link (Section 18 #4).
 */
export default function ForgotPassword() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { recovery, endRecovery } = useSession();
  const offline = useIsOffline();
  const [mode, setMode] = useState<'request' | 'set' | 'checking'>(code ? 'checking' : 'request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    exchangeResetCode(code).then((ok) => {
      if (ok) setMode('set');
      else {
        setMode('request');
        setError(messages.serverError);
      }
    });
  }, [code]);

  const send = async () => {
    setBusy(true);
    await requestPasswordReset(email).catch(() => {});
    setBusy(false);
    setSent(true); // Same message whatever happened (OP3).
  };

  const save = async () => {
    setBusy(true);
    const res = await setNewPassword(password);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    endRecovery(); // The gate now sends the user to S6 (or S5 if no PIN on this device).
  };

  if (recovery || mode === 'set' || mode === 'checking') {
    const ok = isValidPassword(password);
    return (
      <Screen width="narrow">
        <Header onBack={async () => { await logOut(); endRecovery(); router.replace('/log-in'); }} />
        <Title subtitle={messages.passwordRule}>Set a new password</Title>
        {error ? <Banner tone="error" text={error} /> : null}
        <Card>
          <TextField
            label={labels.newPassword}
            value={password}
            onChangeText={setPassword}
            onBlur={() => setTouched(true)}
            password
            autoComplete="new-password"
            error={touched && !ok ? messages.passwordRule : undefined}
          />
          <Button title={labels.save} onPress={save} loading={busy || mode === 'checking'} disabled={!ok || offline} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen width="narrow">
      <Header />
      <Title subtitle="Enter the email address of your account. We’ll send you a link to reset your password.">
        Reset your password
      </Title>
      {sent ? <Banner tone="success" text={messages.resetSent} /> : null}
      {error ? <Banner tone="error" text={error} /> : null}
      <Card>
        <TextField
          label={labels.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Button
          title={labels.sendLink}
          onPress={send}
          loading={busy}
          disabled={!isValidEmail(email) || offline}
          trailingIcon={<ArrowRight color={tokens.color.surface} size={20} />}
        />
        <View style={styles.center}>
          <LinkButton label={labels.logIn} onPress={() => router.replace('/log-in')} />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
});
