import { router, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { useIsOffline } from '../../components/OfflineBanner';
import { TextField } from '../../components/TextField';
import { Banner, Choices, Header, Screen, Small, Title } from '../../components/ui';
import { saveInstruction } from '../../lib/api/vault';
import { messageForError } from '../../lib/errors';
import { labels, messages } from '../../lib/messages';
import { useInstructions, usePeople, useRefreshAll } from '../../lib/queries';
import { INSTRUCTION_SECTIONS } from '../../lib/rules/categories';
import { tokens } from '../../theme/tokens';

const KINDS = [
  { key: 'instruction', label: labels.instruction },
  { key: 'message', label: labels.personalMessage },
] as const;

/** S16 Write Instruction or Message (docs/designs/S16.png), US9. */
export default function WriteInstruction() {
  const params = useLocalSearchParams<{ id?: string; kind?: string }>();
  const instructions = useInstructions();
  const people = usePeople();
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const existing = instructions.data?.find((i) => i.id === params.id);

  const [kind, setKind] = useState<'instruction' | 'message'>(params.kind === 'message' ? 'message' : 'instruction');
  const [section, setSection] = useState<string | null>('general');
  const [recipient, setRecipient] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Copy loaded data into the form once per loaded item (React: adjust state while rendering).
  const [loadedKey, setLoadedKey] = useState<unknown>(null);
  if (existing && loadedKey !== existing.id) {
    setLoadedKey(existing.id);
    setKind(existing.kind);
    setSection(existing.section);
    setRecipient(existing.recipient_id);
    setText(existing.text);
  }

  // Personal messages go only to accepted trusted contacts (US9, SEC8).
  const accepted = (people.data?.contacts ?? []).filter((c) => c.status === 'accepted');
  const recipientName = accepted.find((c) => c.id === recipient)?.name;
  const valid = text.trim().length > 0 && (kind === 'instruction' ? !!section : !!recipient);

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await saveInstruction(params.id ?? null, { kind, section, recipient_id: recipient, text });
      await refreshAll();
      router.replace('/instructions');
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen width="narrow" footer={<Button title={labels.save} onPress={save} loading={busy} disabled={!valid || offline} />}>
      <Header />
      <Title>{params.id ? 'Edit' : 'Write'}</Title>
      {error ? <Banner tone="error" text={error} /> : null}

      {!params.id ? <Choices options={KINDS} value={kind} onChange={setKind} /> : null}

      {kind === 'instruction' ? (
        <Choices label="Section" options={INSTRUCTION_SECTIONS} value={section} onChange={setSection} />
      ) : accepted.length ? (
        <>
          <Choices label="To" options={accepted.map((c) => ({ key: c.id, label: c.name }))} value={recipient} onChange={setRecipient} />
          {recipientName ? <Small>{messages.messageOnlyFor(recipientName.split(' ')[0])}</Small> : null}
        </>
      ) : (
        <Banner tone="warning" text="Personal messages can go only to a trusted contact who has accepted your invitation." />
      )}

      <TextField label="Text" value={text} onChangeText={setText} multiline maxLength={2000} />

      {params.id ? (
        <Button
          title={labels.delete}
          variant="danger"
          disabled={offline}
          onPress={() => router.push(`/modals/delete-item?kind=instruction&id=${params.id}`)}
          trailingIcon={<Trash2 color={tokens.color.surface} size={18} />}
        />
      ) : null}
    </Screen>
  );
}
