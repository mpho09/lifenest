import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  Banknote,
  BellRing,
  Car,
  FilePen,
  HeartPulse,
  IdCard,
  Shield,
  UserRound,
  Users,
  type LucideIcon,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { AppState, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useIsOffline } from '../../components/OfflineBanner';
import { AlertCard, ChecklistRow } from '../../components/rows';
import { Skeleton } from '../../components/Skeleton';
import { FlatRing } from '../../components/three/FlatRing';
import { ReadinessRingScene } from '../../components/three/ReadinessRingScene';
import { Scene3DGate } from '../../components/three/Scene3DGate';
import { Toast } from '../../components/Toast';
import { Banner, Card, Checkbox, Columns, Row, Screen, SectionTitle } from '../../components/ui';
import { confirmReview, markNotificationRead, setOwnsNoPropertyOrVehicle } from '../../lib/api/profile';
import { labels, messages } from '../../lib/messages';
import {
  useNotifications,
  useOpenRequest,
  usePeople,
  useProfile,
  useReadiness,
  useRefreshAll,
} from '../../lib/queries';
import { formatDate } from '../../lib/rules/format';
import { isReviewDue, READINESS_ITEMS, type ReadinessKey } from '../../lib/rules/readiness';
import { tokens } from '../../theme/tokens';

const ICONS: Record<ReadinessKey, LucideIcon> = {
  profile: UserRound,
  identity: IdCard,
  insurance: Shield,
  property_vehicles: Car,
  banking: Banknote,
  emergency: HeartPulse,
  contact: Users,
  instruction: FilePen,
};

/** S7 Home (docs/designs/S7.png, PRD 8.2). */
export default function Home() {
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const offline = useIsOffline();
  const profile = useProfile();
  const readiness = useReadiness();
  const notifications = useNotifications();
  const openRequest = useOpenRequest();
  const people = usePeople();
  const refreshAll = useRefreshAll();
  const [ringActive, setRingActive] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // T-3D-5: the ring's frame loop pauses when Home is not focused or the app is in the background.
  useFocusEffect(
    useCallback(() => {
      setRingActive(AppState.currentState === 'active');
      const sub = AppState.addEventListener('change', (s) => setRingActive(s === 'active'));
      return () => {
        sub.remove();
        setRingActive(false);
      };
    }, []),
  );

  const refresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const firstName = profile.data?.full_name?.split(' ')[0];
  const done = readiness.data?.done ?? 0;
  const items = readiness.data?.items ?? [];
  const isDone = (key: string) => items.find((i) => i.key === key)?.done ?? false;
  const unread = (notifications.data ?? []).filter((n) => !n.is_read && n.type !== 'review_due');
  const reviewDue =
    isReviewDue(profile.data?.last_reviewed_at) ||
    (notifications.data ?? []).some((n) => n.type === 'review_due' && !n.is_read);
  const open = openRequest.data;
  const sharedCount = people.data?.shared_with_me.length ?? 0;

  const loading = readiness.isLoading || profile.isLoading;
  const failed = !readiness.data && (readiness.isError || profile.isError);

  const openNotification = async (id: string, target: string | null) => {
    await markNotificationRead(id).catch(() => {});
    refreshAll();
    if (target) router.push(target as never);
  };

  return (
    <Screen onRefresh={refresh} refreshing={refreshing}>
      <AppHeader greeting={firstName ? `Hello, ${firstName}` : 'Hello'} />

      {open && ['submitted', 'verified'].includes(open.status) ? (
        <AlertCard
          text={`${open.requester_name} has asked for access to your information. If you are OK, cancel this request within 7 days.`}
          actionLabel={labels.view}
          onPress={() => router.push('/access-alert')}
        />
      ) : null}
      {open?.status === 'released' && open.released_at ? (
        <AlertCard
          text={messages.releasedOn(formatDate(open.released_at))}
          actionLabel={labels.view}
          onPress={() => router.push('/access-alert')}
        />
      ) : null}

      {reviewDue ? (
        <Card>
          <Text style={styles.body}>{messages.reviewDue}</Text>
          <Row style={styles.wrap}>
            <Button
              title={labels.everythingUpToDate}
              variant="secondary"
              disabled={offline}
              onPress={async () => {
                await confirmReview().catch(() => {});
                refreshAll();
              }}
            />
            <Button title={labels.reviewNow} onPress={() => router.push('/documents')} />
          </Row>
        </Card>
      ) : null}

      {failed ? (
        <Banner tone="error" text={messages.serverError} actionLabel={labels.tryAgain} onAction={refresh} />
      ) : loading ? (
        <Card>
          <Skeleton variant="ring" />
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="row" />
          ))}
        </Card>
      ) : (
        <Columns
          main={
            <Card>
              <Pressable accessibilityRole="button" accessibilityLabel={`Readiness: ${messages.readinessCount(done)}`}>
                <Scene3DGate
                  renderScene={({ onFps }) => <ReadinessRingScene done={done} active={ringActive} onFps={onFps} />}
                  fallback={<FlatRing done={done} />}
                />
              </Pressable>
              {done <= 1 ? (
                <EmptyState
                  icon={IdCard}
                  text={messages.homeEmpty}
                  buttonLabel={labels.addIdDocument}
                  onButtonPress={() => router.push('/document/edit?category=identity')}
                />
              ) : null}
            </Card>
          }
          side={
            <View style={styles.side}>
              <SectionTitle>Checklist</SectionTitle>
              <Card>
                {READINESS_ITEMS.map((item) => {
                  const itemDone = isDone(item.key);
                  return (
                    <ChecklistRow
                      key={item.key}
                      label={item.label}
                      done={itemDone}
                      icon={ICONS[item.key]}
                      onPress={() => router.push((itemDone ? item.done : item.todo) as never)}
                      extra={
                        item.key === 'property_vehicles' && !isDone('property_vehicles') ? (
                          <View style={styles.indent}>
                            <Checkbox
                              label={labels.iDontOwnAny}
                              checked={!!profile.data?.owns_no_property_or_vehicle}
                              onChange={async (v) => {
                                if (offline) return;
                                await setOwnsNoPropertyOrVehicle(v).catch(() => {});
                                refreshAll();
                              }}
                            />
                          </View>
                        ) : item.key === 'property_vehicles' && profile.data?.owns_no_property_or_vehicle ? (
                          <View style={styles.indent}>
                            <Checkbox
                              label={labels.iDontOwnAny}
                              checked
                              onChange={async () => {
                                if (offline) return;
                                await setOwnsNoPropertyOrVehicle(false).catch(() => {});
                                refreshAll();
                              }}
                            />
                          </View>
                        ) : null
                      }
                    />
                  );
                })}
              </Card>
            </View>
          }
        />
      )}

      {unread.length ? (
        <>
          <SectionTitle>{labels.updates}</SectionTitle>
          <Card>
            {unread.map((n) => (
              <Pressable
                key={n.id}
                accessibilityRole="button"
                onPress={() => openNotification(n.id, n.link_target)}
                style={styles.update}
              >
                <BellRing color={tokens.color.accent} size={20} />
                <View style={styles.flex}>
                  <Text style={styles.body}>{n.text}</Text>
                  <Text style={styles.meta}>{formatDate(n.created_at)}</Text>
                </View>
              </Pressable>
            ))}
          </Card>
        </>
      ) : null}

      {sharedCount ? (
        <Card>
          <SectionTitle>{labels.sharedWithMe}</SectionTitle>
          <Text style={styles.body}>{messages.sharedWithMe(sharedCount)}</Text>
          <Button title={labels.view} variant="secondary" onPress={() => router.push('/people')} />
        </Card>
      ) : null}

      {toast ? <Toast key={toast} message={toast} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  side: { gap: tokens.space[2] },
  wrap: { flexWrap: 'wrap' },
  body: { ...tokens.font.body, color: tokens.color.text },
  meta: { ...tokens.font.small, color: tokens.color.textSecondary },
  indent: { paddingLeft: tokens.size.touchMin + tokens.space[2] },
  update: {
    flexDirection: 'row',
    gap: tokens.space[4],
    paddingVertical: tokens.space[2],
    minHeight: tokens.size.touchMin,
  },
});
