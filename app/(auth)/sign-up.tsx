import { router, useLocalSearchParams } from 'expo-router';
import { Lock, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { useIsOffline } from '../../components/OfflineBanner';
import { TextField } from '../../components/TextField';
import { Banner, Body, Card, Checkbox, Header, LinkButton, Row, Screen, Small, Title } from '../../components/ui';
import { signUp } from '../../lib/api/auth';
import { getInviteEmail } from '../../lib/api/contacts';
import { INVITE_TOKEN_KEY } from '../../lib/invite';
import { PRIVACY_URL } from '../../lib/links';
import { lockStorage } from '../../lib/lock/storage';
import { labels, messages } from '../../lib/messages';
import { isValidEmail, isValidPassword } from '../../lib/rules/password';
import { tokens } from '../../theme/tokens';


/** S2 Sign Up (docs/designs/S2.png): normal mode and invite mode (email locked). */
export default function SignUp() {
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const offline = useIsOffline();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [is18, setIs18] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; emailTaken?: boolean } | null>(null);
  const [inviteInfo, setInviteInfo] = useState<{ owner_name: string; expired: boolean } | null>(null);

  useEffect(() => {
    if (!invite) return;
    lockStorage.set(INVITE_TOKEN_KEY, invite);
    getInviteEmail(invite)
      .then((info) => {
        if (!info) return;
        setEmail(info.email);
        setInviteInfo({ owner_name: info.owner_name, expired: info.status === 'expired' || new Date(info.expires_at) < new Date() });
      })
      .catch(() => {});
  }, [invite]);

  const passwordOk = isValidPassword(password);
  const canSubmit = isValidEmail(email) && passwordOk && is18 && agreed && !offline && !busy;

  const submit = async () => {
    setBusy(true);
    setError(null);
    const res = await signUp(email, password);
    setBusy(false);
    if (res.ok) {
      router.replace({ pathname: '/log-in', params: { registered: '1', email: email.trim().toLowerCase() } });
    } else {
      setError({ message: res.message, emailTaken: res.code === 'email_taken' });
    }
  };

  return (
    <Screen width="narrow">
      <Header />
      <Title subtitle="Start organising what matters most.">Create your account</Title>

      {inviteInfo ? (
        <Card>
          <Row>
            <View style={styles.inviteIcon}>
              <Users color={tokens.color.primary} size={20} />
            </View>
            <Body style={styles.flex}>{`${inviteInfo.owner_name} added you as a trusted contact`}</Body>
          </Row>
          {inviteInfo.expired ? <Banner tone="error" text={messages.inviteExpired} /> : null}
        </Card>
      ) : null}

      {error ? (
        <Banner
          tone="error"
          text={error.message}
          actionLabel={error.emailTaken ? labels.logIn : undefined}
          onAction={error.emailTaken ? () => router.replace('/log-in') : undefined}
        />
      ) : null}

      <TextField
        label={labels.email}
        value={email}
        onChangeText={setEmail}
        editable={!invite || !inviteInfo}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        testID="sign-up-email"
      />
      {invite && inviteInfo ? (
        <Row>
          <Lock color={tokens.color.textSecondary} size={14} />
          <Small>This is the email your invitation was sent to.</Small>
        </Row>
      ) : null}

      <TextField
        label={labels.password}
        value={password}
        onChangeText={setPassword}
        onBlur={() => setPasswordTouched(true)}
        password
        autoComplete="new-password"
        error={passwordTouched && !passwordOk ? messages.passwordRule : undefined}
        testID="sign-up-password"
      />
      {!passwordTouched || passwordOk ? <Small>{messages.passwordRule}</Small> : null}

      <Checkbox label={labels.is18} checked={is18} onChange={setIs18} />
      <Checkbox label={labels.agreePrivacy} checked={agreed} onChange={setAgreed}>
        <Text style={styles.body}>
          I agree to the{' '}
          <Text
            style={styles.link}
            accessibilityRole="link"
            onPress={PRIVACY_URL ? () => Linking.openURL(PRIVACY_URL) : undefined}
          >
            Privacy Notice
          </Text>
        </Text>
      </Checkbox>

      <Button title={labels.signUp} onPress={submit} disabled={!canSubmit} loading={busy} />
      <View style={styles.center}>
        <LinkButton label={labels.logIn} onPress={() => router.replace('/log-in')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center' },
  body: { ...tokens.font.body, color: tokens.color.text },
  link: { color: tokens.color.primary, textDecorationLine: 'underline' },
  inviteIcon: {
    width: tokens.size.touchMin - tokens.space[2],
    height: tokens.size.touchMin - tokens.space[2],
    borderRadius: tokens.radius.input,
    backgroundColor: tokens.color.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
