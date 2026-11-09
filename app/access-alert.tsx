import { router } from 'expo-router';
import { BellRing, XCircle } from 'lucide-react-native';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { Button } from '../components/Button';
import { Skeleton } from '../components/Skeleton';
import { Banner, Card, Header, Row, Screen, Small, Title } from '../components/ui';
import { useIsOffline } from '../components/OfflineBanner';
import { labels, messages } from '../lib/messages';
import { useOpenRequest } from '../lib/queries';
import { formatDate } from '../lib/rules/format';
import { tokens } from '../theme/tokens';

const REASON = { death: 'Death', incapacity: 'Incapacity' } as const;

/** S21 Access Request Alert (docs/designs/S21.png): open request or release (US12, US13). Back goes to S7. */
export default function AccessAlert() {
  const open = useOpenRequest();
  const offline = useIsOffline();
  const goHome = () => router.replace('/');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, []);

  if (open.isLoading) {
    return (
      <Screen>
        <Header onBack={goHome} />
        <Skeleton variant="line" />
        <Skeleton variant="row" />
      </Screen>
    );
  }

  const r = open.data;
  if (!r) {
    return (
      <Screen>
        <Header onBack={goHome} />
        {open.isError ? (
          <Banner tone="error" text={messages.serverError} actionLabel={labels.tryAgain} onAction={() => open.refetch()} />
        ) : (
          <Banner tone="success" text="There is no open request on your vault." />
        )}
      </Screen>
    );
  }

  if (r.status === 'released' && r.released_at) {
    return (
      <Screen>
        <Header onBack={goHome} />
        <Title subtitle="Your trusted contacts can see your information at their access level.">
          {messages.releasedOn(formatDate(r.released_at))}
        </Title>
        <Card>
          <Small>Asked by</Small>
          <Text style={styles.bodyStrong}>{r.requester_name}</Text>
          <Small>Reason</Small>
          <Text style={styles.body}>{REASON[r.reason]}</Text>
        </Card>
        <Banner tone="info" text="If you are OK, close access. Every contact loses access at once." />
        <Button title={labels.closeAccess} variant="danger" disabled={offline} onPress={() => router.push('/modals/remove-or-close?mode=close')} />
      </Screen>
    );
  }

  const daysLeft = Math.max(0, Math.ceil((new Date(r.waiting_ends_at).getTime() - now) / 86_400_000));

  return (
    <Screen>
      <Header onBack={goHome} />
      <Title subtitle="If you are OK, cancel this request within 7 days.">Someone has asked for access to your information</Title>
      <Card>
        <Row>
          <View style={styles.bell}>
            <BellRing color={tokens.color.primary} size={22} />
          </View>
          <View style={styles.flex}>
            <Small>Asked by</Small>
            <Text style={styles.bodyStrong}>{r.requester_name}</Text>
          </View>
        </Row>
        <Small>Reason</Small>
        <Text style={styles.body}>{REASON[r.reason]}</Text>
        <Small>Date asked</Small>
        <Text style={styles.body}>{formatDate(r.submitted_at)}</Text>
        <Small>Waiting period ends</Small>
        <Text style={styles.body}>{`${formatDate(r.waiting_ends_at)} (${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left)`}</Text>
      </Card>
      <Banner tone="info" text="Nothing is released unless we have checked the proof and the waiting period ends without you cancelling." />
      <Button
        title={labels.cancelRequest}
        variant="danger"
        disabled={offline}
        onPress={() => router.push(`/modals/cancel-request?id=${r.id}`)}
        trailingIcon={<XCircle color={tokens.color.surface} size={18} />}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { ...tokens.font.body, color: tokens.color.text },
  bodyStrong: { ...tokens.font.button, color: tokens.color.text },
  bell: {
    width: tokens.size.touchMin,
    height: tokens.size.touchMin,
    borderRadius: tokens.radius.circle,
    backgroundColor: tokens.color.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
