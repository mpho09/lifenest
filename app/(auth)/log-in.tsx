import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '../../components/Button';
import { Logo } from '../../components/Logo';
import { useIsOffline } from '../../components/OfflineBanner';
import { TextField } from '../../components/TextField';
import { Banner, Card, LinkButton, Screen, Title } from '../../components/ui';
import { logIn, resendVerification } from '../../lib/api/auth';
import { labels, messages } from '../../lib/messages';
import { isValidEmail } from '../../lib/rules/password';
import { tokens } from '../../theme/tokens';

/** S3 Log In (docs/designs/S3.png). Navigation after log-in is done by the Section 11 gate. */
export default function LogIn() {
  const params = useLocalSearchParams<{ registered?: string; email?: string; verified?: string; notice?: string }>();
  const offline = useIsOffline();
  const [email, setEmail] = useState(params.email ?? '');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; unverified?: boolean } | null>(null);
  const [resent, setResent] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await logIn(email, password);
    setBusy(false);
    if (!res.ok) setError({ message: res.message, unverified: res.code === 'unverified' });
  };

  return (
    <Screen>
      <View style={styles.logo}>
        <Logo />
      </View>
      <Title subtitle="Your important information is waiting for you.">Welcome back</Title>

      {params.notice === 'pins' && !error ? <Banner tone="error" text={messages.tooManyPins} /> : null}
      {params.registered && !error ? <Banner tone="warning" text={messages.verifyBanner} /> : null}
      {error ? (
        <Banner
          tone="error"
          text={resent ? messages.verifyBanner : error.message}
          actionLabel={error.unverified && !resent ? labels.resendEmail : undefined}
          onAction={
            error.unverified
              ? async () => {
                  await resendVerification(email);
                  setResent(true);
                }
              : undefined
          }
        />
      ) : null}

      <Card>
        <TextField
          label={labels.email}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          testID="log-in-email"
        />
        <TextField
          label={labels.password}
          value={password}
          onChangeText={setPassword}
          password
          autoComplete="current-password"
          testID="log-in-password"
        />
        <View style={styles.right}>
          <LinkButton label={labels.forgotPassword} onPress={() => router.push('/forgot-password')} />
        </View>
        <Button
          title={labels.logIn}
          onPress={submit}
          loading={busy}
          disabled={!isValidEmail(email) || !password || offline}
        />
      </Card>

      <View style={styles.center}>
        <LinkButton label={labels.signUp} onPress={() => router.replace('/sign-up')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: { alignItems: 'center', paddingTop: tokens.space[4] },
  right: { alignItems: 'flex-end' },
  center: { alignItems: 'center' },
});
