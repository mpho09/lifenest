import { router, useLocalSearchParams } from 'expo-router';
import { Camera, FileText, ImageIcon, Upload, X } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { useIsOffline } from '../../components/OfflineBanner';
import { TextField } from '../../components/TextField';
import { Banner, Card, Choices, Header, Row, Screen, Small, Title } from '../../components/ui';
import { updateDocumentDetails, uploadDocument } from '../../lib/api/documents';
import { messageForError } from '../../lib/errors';
import { pickFile, pickPhoto, takePhoto, type PickResult } from '../../lib/files/pick';
import type { PreparedFile } from '../../lib/files/preparePhoto';
import { labels, messages } from '../../lib/messages';
import { useDocument, useRefreshAll } from '../../lib/queries';
import { notesPasswordWarning } from '../../lib/rules/asset';
import { CATEGORIES, isCategory, type Category } from '../../lib/rules/categories';
import { tokens } from '../../theme/tokens';

/** S10 Add or Edit Document (docs/designs/S10.png). */
export default function EditDocument() {
  const params = useLocalSearchParams<{ id?: string; category?: string }>();
  const editing = !!params.id;
  const existing = useDocument(params.id);
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();

  const [file, setFile] = useState<{ file: PreparedFile; name: string } | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category | null>(params.category && isCategory(params.category) ? params.category : null);
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<{ message: string; retry?: boolean; settings?: boolean } | null>(null);

  const d = existing.data?.document;
  // Copy loaded data into the form once per loaded item (React: adjust state while rendering).
  const [loadedKey, setLoadedKey] = useState<unknown>(null);
  if (d && loadedKey !== d.id) {
    setLoadedKey(d.id);
    setTitle(d.title);
    setCategory(d.category);
    setNotes(d.notes ?? '');
  }

  const handlePick = async (pick: () => Promise<PickResult>) => {
    setError(null);
    setPreparing(true);
    try {
      const res = await pick();
      if (res.status === 'picked') {
        setFile({ file: res.file, name: res.name });
        if (!title) setTitle(res.name.replace(/\.[^.]+$/, '').slice(0, 80));
      } else if (res.status === 'rejected') {
        setError({ message: res.message });
      } else if (res.status === 'permission') {
        setError({ message: messages.mediaPermission, settings: true });
      }
    } catch {
      setError({ message: messages.fileRejected });
    } finally {
      setPreparing(false);
    }
  };

  const save = async () => {
    if (!category) return;
    setBusy(true);
    setError(null);
    try {
      if (editing && params.id) {
        await updateDocumentDetails(params.id, { title, category, notes });
      } else if (file) {
        await uploadDocument({ file: file.file, title, category, notes });
      }
      await refreshAll();
      if (editing) router.back();
      else router.replace({ pathname: '/documents', params: { toast: messages.saved } });
    } catch (e) {
      const msg = messageForError(e as never);
      // Network or storage failures: keep everything and offer "Try again" (T-US4-3).
      setError(
        msg === messages.serverError ? { message: messages.uploadFailed, retry: true } : { message: msg },
      );
    } finally {
      setBusy(false);
    }
  };

  const valid = title.trim().length > 0 && !!category && (editing || !!file);
  const warning = notesPasswordWarning(notes);

  return (
    <Screen width="narrow"
      footer={
        <Button title={labels.save} onPress={save} loading={busy} disabled={!valid || offline || preparing} />
      }
    >
      <Header />
      <Title>{editing ? 'Edit document' : 'Add a document'}</Title>

      {error ? (
        <Banner
          tone="error"
          text={error.message}
          actionLabel={error.retry ? labels.tryAgain : error.settings ? 'Open settings' : undefined}
          onAction={error.retry ? save : error.settings ? () => Linking.openSettings() : undefined}
        />
      ) : null}

      {!editing ? (
        <Card>
          {file ? (
            <Row>
              <FileText color={tokens.color.primary} size={24} />
              <View style={styles.flex}>
                <Text style={styles.body} numberOfLines={1}>
                  {file.name}
                </Text>
                <Small>{`${Math.max(1, Math.round(file.file.size / 1024))} KB`}</Small>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Remove file" onPress={() => setFile(null)} style={styles.iconButton}>
                <X color={tokens.color.textSecondary} size={20} />
              </Pressable>
            </Row>
          ) : (
            <View style={styles.drop}>
              <Upload color={tokens.color.primary} size={28} />
              <Text style={styles.bodyStrong}>Choose a file</Text>
              <Small>PDF or photo, up to 10 MB.</Small>
            </View>
          )}
          <Row style={styles.wrap}>
            <Button title="Choose file" onPress={() => handlePick(pickFile)} loading={preparing} trailingIcon={<FileText color={tokens.color.surface} size={18} />} />
            <Button title="Photo" variant="secondary" onPress={() => handlePick(pickPhoto)} disabled={preparing} trailingIcon={<ImageIcon color={tokens.color.primary} size={18} />} />
            <Button title="Take photo" variant="secondary" onPress={() => handlePick(takePhoto)} disabled={preparing} trailingIcon={<Camera color={tokens.color.primary} size={18} />} />
          </Row>
        </Card>
      ) : null}

      <TextField label="Title" value={title} onChangeText={setTitle} maxLength={80} testID="document-title" />
      <Choices label="Category" options={CATEGORIES} value={category} onChange={(k) => setCategory(k)} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={500} />
      {warning ? <Banner tone="warning" text={warning} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  wrap: { flexWrap: 'wrap' },
  body: { ...tokens.font.body, color: tokens.color.text },
  bodyStrong: { ...tokens.font.button, color: tokens.color.text },
  drop: { alignItems: 'center', gap: tokens.space[2], paddingVertical: tokens.space[4] },
  iconButton: { width: tokens.size.touchMin, height: tokens.size.touchMin, alignItems: 'center', justifyContent: 'center' },
});
