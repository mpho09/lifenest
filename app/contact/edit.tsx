import { router, useLocalSearchParams } from 'expo-router';
import { Send, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { useIsOffline } from '../../components/OfflineBanner';
import { StatusChip } from '../../components/rows';
import { TextField } from '../../components/TextField';
import { Banner, Card, Choices, Header, Screen, SectionTitle, Small, Title } from '../../components/ui';
import { inviteContact, resendInvite, updateContact } from '../../lib/api/contacts';
import { messageForError } from '../../lib/errors';
import { labels, messages } from '../../lib/messages';
import { useAccessHistory, usePeople, useRefreshAll } from '../../lib/queries';
import { ACCESS_LEVELS, SECTIONS, type AccessLevel } from '../../lib/rules/categories';
import { validateContact } from '../../lib/rules/contact';
import { formatDate } from '../../lib/rules/format';
import { tokens } from '../../theme/tokens';

const ACTION_LABELS: Record<string, string> = {
  invite_sent: 'Invitation sent',
  invite_accepted: 'Invitation accepted',
  invite_declined: 'Invitation declined',
  request_submitted: 'Asked for access',
  request_verified: 'Request verified',
  request_rejected: 'Request rejected',
  request_cancelled: 'Request cancelled',
  released: 'Information released',
  revoked: 'Access closed',
  viewed: 'Viewed',
  downloaded: 'Downloaded',
  contact_removed: 'Removed',
};

/** S14 Add or Edit Trusted Contact (docs/designs/S14.png), BR4, BR5, BR13. */
export default function EditContact() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editing = !!id;
  const people = usePeople();
  const history = useAccessHistory(id);
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const contact = people.data?.contacts.find((c) => c.id === id);

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [level, setLevel] = useState<AccessLevel>('selected');
  const [sections, setSections] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy loaded data into the form once per loaded item (React: adjust state while rendering).
  const [loadedKey, setLoadedKey] = useState<unknown>(null);
  if (contact && loadedKey !== contact.id) {
    setLoadedKey(contact.id);
    setName(contact.name);
    setRelationship(contact.relationship);
    setEmail(contact.email);
    setPhone(contact.phone ?? '');
    setLevel(contact.access_level);
    setSections(contact.allowed_sections);
  }

  const errors = validateContact({ name, relationship, email, phone });
  const sectionsOk = level !== 'selected' || sections.length > 0;
  const valid = Object.keys(errors).length === 0 && sectionsOk;

  const save = async () => {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const input = { name, relationship, email, phone, access_level: level, allowed_sections: sections };
      if (editing && id) await updateContact(id, input);
      else await inviteContact(input);
      await refreshAll();
      router.replace({ pathname: '/people', params: { toast: editing ? messages.saved : 'Invite sent' } });
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await resendInvite(id);
      await refreshAll();
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(false);
    }
  };

  const toggleSection = (key: string) => setSections((s) => (s.includes(key) ? s.filter((x) => x !== key) : [...s, key]));

  return (
    <Screen width="narrow"
      footer={
        <Button
          title={editing ? labels.save : labels.sendInvite}
          onPress={save}
          loading={busy}
          disabled={offline || (touched && !valid)}
          trailingIcon={editing ? undefined : <Send color={tokens.color.surface} size={18} />}
        />
      }
    >
      <Header right={contact ? <StatusChip status={contact.status} /> : undefined} />
      <Title>{editing ? (contact?.name ?? 'Trusted contact') : labels.addSomeone}</Title>
      {error ? <Banner tone="error" text={error} /> : null}

      {contact && (contact.status === 'expired' || contact.status === 'declined' || contact.status === 'invited') ? (
        <Card>
          <Small>
            {contact.status === 'invited'
              ? `Invitation sent. It works until ${formatDate(contact.invite_expires_at)}.`
              : contact.status === 'expired'
                ? 'This invitation has expired.'
                : 'This person declined the invitation.'}
          </Small>
          <Button title={labels.resendInvite} variant="secondary" onPress={resend} disabled={offline || busy} />
        </Card>
      ) : null}

      <TextField label="Name" value={name} onChangeText={setName} maxLength={80} error={touched && errors.name ? 'Enter a name.' : undefined} />
      <TextField label="Relationship" value={relationship} onChangeText={setRelationship} maxLength={40} placeholder="e.g. Sister" error={touched && errors.relationship ? 'Enter how you know this person.' : undefined} />
      <TextField
        label={labels.email}
        value={email}
        onChangeText={setEmail}
        editable={!editing}
        keyboardType="email-address"
        autoCapitalize="none"
        error={touched && errors.email ? 'Enter a valid email address.' : undefined}
      />
      <TextField label={labels.phone} value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={touched && errors.phone ? 'Use a South African number, e.g. 082 123 4567.' : undefined} />

      <SectionTitle>Access level</SectionTitle>
      <Choices options={ACCESS_LEVELS} value={level} onChange={setLevel} />
      {level === 'emergency' ? <Small>{messages.emergencyLevelNote}</Small> : null}
      {level === 'full' ? <Small>After release, can see everything in your vault.</Small> : null}
      {level === 'selected' ? (
        <Card>
          <Small>After release, can see only the sections you tick.</Small>
          <Choices options={SECTIONS} value={sections} onChange={toggleSection} multiple />
          {touched && !sectionsOk ? <Text style={styles.error}>Tick at least one section.</Text> : null}
        </Card>
      ) : null}

      {editing ? (
        <>
          <SectionTitle>Access history</SectionTitle>
          <Card>
            {(history.data ?? []).length === 0 ? (
              <Small>Nothing yet.</Small>
            ) : (
              history.data?.map((h) => (
                <View key={h.id} style={styles.historyRow}>
                  <Text style={styles.body}>{[ACTION_LABELS[h.action] ?? h.action, h.item_title].filter(Boolean).join(': ')}</Text>
                  <Small>{formatDate(h.created_at)}</Small>
                </View>
              ))
            )}
          </Card>
          <Button
            title={labels.remove}
            variant="danger"
            disabled={offline}
            onPress={() => router.push(`/modals/remove-or-close?mode=remove&id=${id}`)}
            trailingIcon={<Trash2 color={tokens.color.surface} size={18} />}
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { ...tokens.font.body, color: tokens.color.text },
  error: { ...tokens.font.small, color: tokens.color.error },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: tokens.space[2], paddingVertical: tokens.space[1] },
});
