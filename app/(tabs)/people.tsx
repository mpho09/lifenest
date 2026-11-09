import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { UserPlus } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { useIsOffline } from '../../components/OfflineBanner';
import { ContactCard, StatusChip } from '../../components/rows';
import { Skeleton } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import { Grid, Banner, Card, Row, Screen, SectionTitle, Small, Title } from '../../components/ui';
import { acceptInvite, declineInvite } from '../../lib/api/contacts';
import { messageForError } from '../../lib/errors';
import { acceptStoredInvite } from '../../lib/invite';
import { labels, messages } from '../../lib/messages';
import { usePeople, useRefreshAll } from '../../lib/queries';
import { accessLevelLabel } from '../../lib/rules/categories';
import { MAX_CONTACTS } from '../../lib/rules/contact';
import { tokens } from '../../theme/tokens';

/** S13 People (docs/designs/S13.png): my trusted contacts, invites to me, and vaults shared with me. */
export default function People() {
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const people = usePeople();
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // An invite link opened before logging in is accepted here (T-US8-1).
  useFocusEffect(
    useCallback(() => {
      acceptStoredInvite().then((accepted) => {
        if (accepted) refreshAll();
      });
    }, [refreshAll]),
  );

  const contacts = people.data?.contacts ?? [];
  const active = contacts.filter((c) => c.status === 'invited' || c.status === 'accepted').length;
  const atLimit = active >= MAX_CONTACTS;

  const respond = async (token: string, accept: boolean) => {
    setBusy(token);
    setError(null);
    try {
      if (accept) await acceptInvite(token);
      else await declineInvite(token);
      await refreshAll();
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen onRefresh={refreshAll} refreshing={people.isRefetching}>
      <AppHeader />
      <Title subtitle="The people you trust, and the vaults shared with you.">People</Title>
      {error ? <Banner tone="error" text={error} /> : null}

      {people.isError && !people.data ? (
        <Banner
          tone="error"
          text={messages.serverError}
          actionLabel={labels.tryAgain}
          onAction={() => people.refetch()}
        />
      ) : people.isLoading ? (
        <Card>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="row" />
          ))}
        </Card>
      ) : (
        <>
          {(people.data?.invites ?? []).map((inv) => (
            <Card key={inv.id}>
              <Text style={styles.bodyStrong}>{`${inv.owner_name} added you as a trusted contact`}</Text>
              <Small>{accessLevelLabel(inv.access_level)}</Small>
              {inv.expired ? (
                <Banner tone="error" text={messages.inviteExpired} />
              ) : (
                <Row>
                  <View style={styles.flex}>
                    <Button
                      title={labels.accept}
                      onPress={() => respond(inv.token, true)}
                      loading={busy === inv.token}
                      disabled={offline}
                    />
                  </View>
                  <View style={styles.flex}>
                    <Button
                      title={labels.decline}
                      variant="secondary"
                      onPress={() => respond(inv.token, false)}
                      disabled={offline || busy === inv.token}
                    />
                  </View>
                </Row>
              )}
            </Card>
          ))}

          <SectionTitle right={<Small>{`${active} of ${MAX_CONTACTS}`}</Small>}>My trusted contacts</SectionTitle>
          {contacts.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              text={`Add up to ${MAX_CONTACTS} people you trust. You choose what each person can see.`}
            />
          ) : (
            <Grid columns={3}>
              {contacts.map((c) => (
                <ContactCard
                  key={c.id}
                  name={c.name}
                  relationship={c.relationship}
                  status={c.status}
                  accessLevel={c.access_level}
                  onPress={() => router.push(`/contact/edit?id=${c.id}`)}
                />
              ))}
            </Grid>
          )}
          <Button
            title={labels.addSomeone}
            onPress={() => router.push('/contact/edit')}
            disabled={atLimit || offline}
            trailingIcon={<UserPlus color={tokens.color.surface} size={18} />}
          />
          {atLimit ? <Small>{messages.contactLimit}</Small> : null}

          <SectionTitle>{labels.sharedWithMe}</SectionTitle>
          {(people.data?.shared_with_me ?? []).length === 0 ? (
            <Small>No one has shared their vault with you yet.</Small>
          ) : (
            <Grid columns={3}>
              {people.data?.shared_with_me.map((s) => (
                <Card key={s.owner_id}>
                  <Row>
                    <View style={styles.flex}>
                      <Text style={styles.bodyStrong}>{s.owner_name}</Text>
                      <Small>{accessLevelLabel(s.access_level)}</Small>
                    </View>
                    {s.vault_status === 'released' ? (
                      <StatusChip status="released" />
                    ) : s.vault_status === 'request_open' ? (
                      <StatusChip status="request_open" />
                    ) : null}
                  </Row>
                  <Button
                    title={labels.view}
                    variant="secondary"
                    onPress={() => router.push(`/shared/${s.owner_id}`)}
                  />
                </Card>
              ))}
            </Grid>
          )}
        </>
      )}
      {toast ? <Toast key={toast} message={toast} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  bodyStrong: { ...tokens.font.button, color: tokens.color.text },
});
