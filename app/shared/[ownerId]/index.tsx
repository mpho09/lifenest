import { router, useLocalSearchParams } from 'expo-router';
import { Download, Eye, HeartPulse, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { useIsOffline } from '../../../components/OfflineBanner';
import { AssetRow, DocumentRow, StatusChip } from '../../../components/rows';
import { Skeleton } from '../../../components/Skeleton';
import { Banner, Card, Grid, Header, Row, Screen, SectionTitle, Small, Title } from '../../../components/ui';
import { getFileLink } from '../../../lib/api/documents';
import type { SharedVault as Vault } from '../../../lib/api/types';
import { messageForError } from '../../../lib/errors';
import { labels, messages } from '../../../lib/messages';
import { useRefreshAll, useSharedVault } from '../../../lib/queries';
import { accessLevelLabel, categoryLabel } from '../../../lib/rules/categories';
import { formatDate } from '../../../lib/rules/format';
import { useScreenProtection } from '../../../lib/useScreenProtection';
import { tokens } from '../../../theme/tokens';

function EmergencyCard({ profile }: { profile: NonNullable<Vault['emergency_profile']> }) {
  return (
    <Card>
      <Row>
        <HeartPulse color={tokens.color.primary} size={20} />
        <Text style={styles.bodyStrong}>{labels.emergencyProfile}</Text>
      </Row>
      {profile.emergency_contacts.map((c, i) => (
        <View key={i}>
          <Text style={styles.body}>{c.name}</Text>
          <Small>{[c.relationship, c.phone].filter(Boolean).join(' · ')}</Small>
        </View>
      ))}
      {profile.medical_aid_provider ? (
        <View>
          <Small>Medical aid</Small>
          <Text style={styles.body}>
            {[profile.medical_aid_provider, profile.medical_aid_number].filter(Boolean).join(' · ')}
          </Text>
        </View>
      ) : null}
      {profile.key_notes ? <Text style={styles.body}>{profile.key_notes}</Text> : null}
    </Card>
  );
}

/** S20 Shared Vault (docs/designs/S20.png): before release, request states, and the read-only released view. */
export default function SharedVault() {
  const { ownerId } = useLocalSearchParams<{ ownerId: string }>();
  useScreenProtection();
  const offline = useIsOffline();
  const vault = useSharedVault(ownerId);
  const refreshAll = useRefreshAll();
  const [fileError, setFileError] = useState<string | null>(null);

  if (vault.isLoading) {
    return (
      <Screen>
        <Header />
        <Skeleton variant="line" />
        <Skeleton variant="row" />
      </Screen>
    );
  }

  if (!vault.data) {
    const msg = vault.error ? messageForError(vault.error as never) : messages.notAllowed;
    return (
      <Screen>
        <Header />
        <Banner
          tone="error"
          text={msg}
          actionLabel={msg === messages.serverError ? labels.tryAgain : undefined}
          onAction={msg === messages.serverError ? () => vault.refetch() : undefined}
        />
      </Screen>
    );
  }

  const v = vault.data;
  const released = v.vault_status === 'released';
  const req = v.my_request;
  const canRequest = v.access_level !== 'emergency';
  const myOpen = req && (req.status === 'submitted' || req.status === 'verified');

  // T-S20-2: every view or download by a contact goes through get-file-link and is audited.
  const openFile = async (documentId: string, purpose: 'view' | 'download') => {
    setFileError(null);
    try {
      const url = await getFileLink(documentId, purpose);
      await Linking.openURL(url);
    } catch (e) {
      const msg = messageForError(e as never);
      setFileError(msg);
      if (msg === messages.documentGone) refreshAll(); // T-EDGE-3: back to the updated list
    }
  };

  let status: { chip?: 'request_open' | 'released' | 'rejected'; text?: string } = {};
  if (released) status = { chip: 'released' };
  else if (myOpen) status = { chip: 'request_open', text: messages.requestReceived(formatDate(req.waiting_ends_at)) };
  else if (v.other_request_open) status = { chip: 'request_open', text: messages.requestOpenElsewhere };
  else if (req?.status === 'rejected') status = { chip: 'rejected', text: messages.requestRejected };
  else if (req?.status === 'cancelled') status = { text: messages.requestCancelledByOwner };

  const sectionsShown = Array.from(
    new Set([...v.documents.map((d) => d.category), ...v.assets.map((a) => a.category)]),
  );

  return (
    <Screen onRefresh={refreshAll} refreshing={vault.isRefetching}>
      <Header right={status.chip ? <StatusChip status={status.chip} /> : undefined} />
      <Title subtitle={`${accessLevelLabel(v.access_level)} · read only`}>{`${v.owner_name}’s vault`}</Title>
      {status.text ? <Banner tone={status.chip === 'rejected' ? 'error' : 'info'} text={status.text} /> : null}
      {fileError ? <Banner tone="error" text={fileError} /> : null}

      {!released && canRequest && !myOpen && !v.other_request_open ? (
        <Button
          title={labels.requestAccess}
          disabled={offline}
          onPress={() => router.push(`/shared/${ownerId}/request`)}
        />
      ) : null}

      {v.emergency_profile ? <EmergencyCard profile={v.emergency_profile} /> : null}

      {released ? (
        <>
          {v.messages.map((m) => (
            <Card key={m.id}>
              <Row>
                <Mail color={tokens.color.primary} size={20} />
                <Text style={styles.bodyStrong}>A message for you</Text>
              </Row>
              <Text style={styles.body}>{m.text}</Text>
              <Small>{formatDate(m.updated_at)}</Small>
            </Card>
          ))}

          <Grid>
            {sectionsShown.map((cat) => (
              <View key={cat} style={styles.group}>
                <SectionTitle>{categoryLabel(cat)}</SectionTitle>
                <Card>
                  {v.documents
                    .filter((d) => d.category === cat)
                    .map((d) => (
                      <Row key={d.id}>
                        <View style={styles.flex}>
                          <DocumentRow
                            title={d.title}
                            category={d.category}
                            fileType={d.file_type}
                            createdAt={d.created_at}
                          />
                        </View>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${labels.view} ${d.title}`}
                          onPress={() => openFile(d.id, 'view')}
                          style={styles.icon}
                          disabled={offline}
                        >
                          <Eye color={tokens.color.primary} size={20} />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`${labels.download} ${d.title}`}
                          onPress={() => openFile(d.id, 'download')}
                          style={styles.icon}
                          disabled={offline}
                        >
                          <Download color={tokens.color.primary} size={20} />
                        </Pressable>
                      </Row>
                    ))}
                  {v.assets
                    .filter((a) => a.category === cat)
                    .map((a) => (
                      <View key={a.id}>
                        <AssetRow asset={a} />
                        {[a.provider_phone, a.reference_number, a.originals_location, a.notes]
                          .filter(Boolean)
                          .map((line, i) => (
                            <Small key={i}>{line}</Small>
                          ))}
                      </View>
                    ))}
                </Card>
              </View>
            ))}
          </Grid>

          {v.instructions.length ? (
            <View style={styles.group}>
              <SectionTitle>Instructions</SectionTitle>
              {v.instructions.map((i) => (
                <Card key={i.id}>
                  <Small>{categoryLabel(i.section)}</Small>
                  <Text style={styles.body}>{i.text}</Text>
                </Card>
              ))}
            </View>
          ) : null}
        </>
      ) : !v.emergency_profile && !status.text ? (
        <Small>
          Nothing is shared yet. Information is released only after a checked request and a 7-day waiting period.
        </Small>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  group: { gap: tokens.space[2] },
  body: { ...tokens.font.body, color: tokens.color.text },
  bodyStrong: { ...tokens.font.button, color: tokens.color.text },
  icon: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
});
