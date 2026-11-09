import { router, useLocalSearchParams } from 'expo-router';
import { FileCheck2, Upload } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/Button';
import { useIsOffline } from '../../../components/OfflineBanner';
import { Banner, Card, Checkbox, Choices, Header, Row, Screen, Small, Title } from '../../../components/ui';
import { submitAccessRequest } from '../../../lib/api/vault';
import { messageForError } from '../../../lib/errors';
import { pickFile, type PickResult } from '../../../lib/files/pick';
import type { PreparedFile } from '../../../lib/files/preparePhoto';
import { labels, messages } from '../../../lib/messages';
import { useRefreshAll, useSharedVault } from '../../../lib/queries';
import { tokens } from '../../../theme/tokens';

const REASONS = [
  { key: 'death', label: 'Death' },
  { key: 'incapacity', label: 'Incapacity' },
] as const;

type Picked = { file: PreparedFile; name: string } | null;

function FilePick({ label, hint, value, onPick }: { label: string; hint: string; value: Picked; onPick: () => void }) {
  return (
    <Card>
      <Text style={styles.bodyStrong}>{label}</Text>
      <Small>{hint}</Small>
      {value ? (
        <Row>
          <FileCheck2 color={tokens.color.success} size={20} />
          <Text style={[styles.body, styles.flex]} numberOfLines={1}>
            {value.name}
          </Text>
        </Row>
      ) : null}
      <Button title={value ? 'Choose another file' : 'Choose file'} variant="secondary" onPress={onPick} trailingIcon={<Upload color={tokens.color.primary} size={18} />} />
    </Card>
  );
}

/** S19 Request Access (docs/designs/S19.png), BR6. */
export default function RequestAccess() {
  const { ownerId } = useLocalSearchParams<{ ownerId: string }>();
  const vault = useSharedVault(ownerId);
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const [reason, setReason] = useState<'death' | 'incapacity' | null>(null);
  const [proof, setProof] = useState<Picked>(null);
  const [idCopy, setIdCopy] = useState<Picked>(null);
  const [declared, setDeclared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ message: string; retry?: boolean } | null>(null);

  const pick = async (set: (p: Picked) => void) => {
    setError(null);
    const res: PickResult = await pickFile();
    if (res.status === 'picked') set({ file: res.file, name: res.name });
    else if (res.status === 'rejected') setError({ message: res.message });
  };

  const submit = async () => {
    if (!reason || !proof || !idCopy) return;
    setBusy(true);
    setError(null);
    try {
      await submitAccessRequest({ ownerId, reason, proof: proof.file, idCopy: idCopy.file });
      await refreshAll();
      router.replace(`/shared/${ownerId}`);
    } catch (e) {
      const msg = messageForError(e as never);
      setError(msg === messages.serverError ? { message: messages.uploadFailed, retry: true } : { message: msg });
    } finally {
      setBusy(false);
    }
  };

  const ownerName = vault.data?.owner_name ?? '';
  const canSubmit = !!reason && !!proof && !!idCopy && declared && !offline;

  return (
    <Screen width="narrow" footer={<Button title={labels.submitRequest} onPress={submit} loading={busy} disabled={!canSubmit} />}>
      <Header />
      <Title subtitle={ownerName ? `Ask for access to ${ownerName}’s information.` : undefined}>{labels.requestAccess}</Title>
      <Banner
        tone="info"
        text="We check your documents first. The account holder is told at once and can cancel within 7 days. Information is released only after both."
      />
      {error ? (
        <Banner tone="error" text={error.message} actionLabel={error.retry ? labels.tryAgain : undefined} onAction={error.retry ? submit : undefined} />
      ) : null}

      <Choices label="Reason" options={REASONS} value={reason} onChange={setReason} />
      <FilePick label="Proof" hint="A death certificate, doctor’s letter or court order. PDF or photo, up to 10 MB." value={proof} onPick={() => pick(setProof)} />
      <FilePick label="Your ID" hint="A copy of your own ID document." value={idCopy} onPick={() => pick(setIdCopy)} />
      <Checkbox label={labels.declaration} checked={declared} onChange={setDeclared} />
      <View />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { ...tokens.font.body, color: tokens.color.text },
  bodyStrong: { ...tokens.font.button, color: tokens.color.text },
});
