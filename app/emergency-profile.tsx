import { router } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '../components/Button';
import { useIsOffline } from '../components/OfflineBanner';
import { TextField } from '../components/TextField';
import { Banner, Card, Header, Row, Screen, SectionTitle, Small, SwitchRow, Title } from '../components/ui';
import { saveEmergencyProfile } from '../lib/api/vault';
import type { EmergencyContact } from '../lib/api/types';
import { messageForError } from '../lib/errors';
import { labels, messages } from '../lib/messages';
import { useEmergencyProfile, useRefreshAll } from '../lib/queries';
import { tokens } from '../theme/tokens';

const MAX_EMERGENCY_CONTACTS = 3;
const blank: EmergencyContact = { name: '', relationship: '', phone: '' };

/** S17 Emergency Profile (docs/designs/S17.png), US10. */
export default function EmergencyProfileScreen() {
  const profile = useEmergencyProfile();
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const [contacts, setContacts] = useState<EmergencyContact[]>([{ ...blank }]);
  const [provider, setProvider] = useState('');
  const [number, setNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [shareNow, setShareNow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const p = profile.data;
  // Copy loaded data into the form once per loaded item (React: adjust state while rendering).
  const [loadedKey, setLoadedKey] = useState<unknown>(null);
  if (p && loadedKey !== 'profile') {
    setLoadedKey('profile');
    setContacts(p.emergency_contacts.length ? p.emergency_contacts : [{ ...blank }]);
    setProvider(p.medical_aid_provider ?? '');
    setNumber(p.medical_aid_number ?? '');
    setNotes(p.key_notes ?? '');
    setShareNow(p.share_now);
  }

  const update = (i: number, field: keyof EmergencyContact, value: string) =>
    setContacts((cs) => cs.map((c, j) => (j === i ? { ...c, [field]: value } : c)));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveEmergencyProfile({
        emergency_contacts: contacts,
        medical_aid_provider: provider,
        medical_aid_number: number,
        key_notes: notes,
        share_now: shareNow,
      });
      await refreshAll();
      router.replace({ pathname: '/', params: { toast: messages.saved } });
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen width="narrow" footer={<Button title={labels.save} onPress={save} loading={busy} disabled={offline} />}>
      <Header />
      <Title subtitle="Emergency contacts and key provider details on one page.">{labels.emergencyProfile}</Title>
      {error ? <Banner tone="error" text={error} /> : null}
      {profile.isError && !profile.data ? <Banner tone="error" text={messages.serverError} actionLabel={labels.tryAgain} onAction={() => profile.refetch()} /> : null}

      <SectionTitle right={<Small>{`${contacts.length} of ${MAX_EMERGENCY_CONTACTS}`}</Small>}>Emergency contacts</SectionTitle>
      {contacts.map((c, i) => (
        <Card key={i}>
          <Row style={styles.between}>
            <Small>{`Contact ${i + 1}`}</Small>
            {contacts.length > 1 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove contact ${i + 1}`}
                onPress={() => setContacts((cs) => cs.filter((_, j) => j !== i))}
                style={styles.icon}
              >
                <X color={tokens.color.textSecondary} size={18} />
              </Pressable>
            ) : null}
          </Row>
          <TextField label="Name" value={c.name} onChangeText={(v) => update(i, 'name', v)} maxLength={80} />
          <TextField label="Relationship" value={c.relationship} onChangeText={(v) => update(i, 'relationship', v)} maxLength={40} />
          <TextField label="Phone" value={c.phone} onChangeText={(v) => update(i, 'phone', v)} keyboardType="phone-pad" maxLength={15} />
        </Card>
      ))}
      {contacts.length < MAX_EMERGENCY_CONTACTS ? (
        <Button
          title="Add contact"
          variant="secondary"
          onPress={() => setContacts((cs) => [...cs, { ...blank }])}
          trailingIcon={<Plus color={tokens.color.primary} size={18} />}
        />
      ) : null}

      <SectionTitle>Medical aid</SectionTitle>
      <TextField label="Medical aid provider" value={provider} onChangeText={setProvider} maxLength={80} />
      <TextField label="Medical aid number (optional)" value={number} onChangeText={setNumber} maxLength={30} />
      <TextField label="Key notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={500} />

      <Card>
        <SwitchRow
          label={labels.shareNow}
          description="Your accepted trusted contacts can see this page now, before any release."
          value={shareNow}
          onChange={setShareNow}
        />
      </Card>
      <View />
    </Screen>
  );
}

const styles = StyleSheet.create({
  between: { justifyContent: 'space-between' },
  icon: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
});
