import { router, useLocalSearchParams } from 'expo-router';
import { Download, ExternalLink, Pencil, RefreshCw, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Linking, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { useIsOffline } from '../../components/OfflineBanner';
import { Skeleton } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import { Banner, Card, Columns, Header, Row, Screen, Small, Title } from '../../components/ui';
import { getFileLink, replaceDocumentFile } from '../../lib/api/documents';
import { messageForError } from '../../lib/errors';
import { pickFile } from '../../lib/files/pick';
import { labels, messages } from '../../lib/messages';
import { useDocument, useRefreshAll } from '../../lib/queries';
import { categoryLabel } from '../../lib/rules/categories';
import { formatDate } from '../../lib/rules/format';
import { useScreenProtection } from '../../lib/useScreenProtection';
import { tokens } from '../../theme/tokens';

/** S9 Document Details (docs/designs/S9.png). */
export default function DocumentDetails() {
  const { id, toast } = useLocalSearchParams<{ id: string; toast?: string }>();
  useScreenProtection();
  const offline = useIsOffline();
  const query = useDocument(id);
  const refreshAll = useRefreshAll();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<'replace' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(toast ?? null);

  const doc = query.data?.document;

  useEffect(() => {
    if (!doc || doc.file_type === 'pdf' || offline) return;
    let active = true;
    getFileLink(doc.id, 'view', doc.file_path)
      .then((url) => active && setPreview(url))
      .catch(() => active && setPreview(null));
    return () => {
      active = false;
    };
  }, [doc, offline]);

  if (query.isLoading) {
    return (
      <Screen>
        <Header />
        <Skeleton variant="ring" />
        <Skeleton variant="line" />
      </Screen>
    );
  }

  if (!doc) {
    return (
      <Screen>
        <Header />
        <Banner
          tone="error"
          text={query.isError ? messages.serverError : messages.documentGone}
          actionLabel={query.isError ? labels.tryAgain : undefined}
          onAction={query.isError ? () => query.refetch() : undefined}
        />
      </Screen>
    );
  }

  const open = async (purpose: 'view' | 'download') => {
    setError(null);
    setBusy(purpose === 'download' ? 'download' : null);
    try {
      const url = await getFileLink(doc.id, purpose, doc.file_path);
      await Linking.openURL(url);
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(null);
    }
  };

  const replace = async () => {
    setError(null);
    const picked = await pickFile();
    if (picked.status === 'rejected') return setError(picked.message);
    if (picked.status === 'permission') return setError(messages.mediaPermission);
    if (picked.status !== 'picked') return;
    setBusy('replace');
    try {
      await replaceDocumentFile(doc, picked.file);
      await refreshAll();
      setNotice(messages.saved);
    } catch {
      setError(messages.uploadFailed);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen>
      <Header />
      <Title>{doc.title}</Title>
      {error ? <Banner tone="error" text={error} /> : null}

      <Columns
        main={
          <View style={styles.stack}>
            <Card style={styles.previewCard}>
              {doc.file_type === 'pdf' ? (
                <View style={styles.pdf}>
                  <Text style={styles.body}>PDF · {doc.size_kb} KB</Text>
                  <Button
                    title={labels.view}
                    variant="secondary"
                    disabled={offline}
                    onPress={() => open('view')}
                    trailingIcon={<ExternalLink color={tokens.color.primary} size={18} />}
                  />
                </View>
              ) : preview ? (
                <Image
                  source={{ uri: preview }}
                  style={styles.image}
                  resizeMode="contain"
                  accessibilityLabel={doc.title}
                />
              ) : (
                <Skeleton variant="ring" />
              )}
            </Card>

            <Row style={styles.actions}>
              <View style={styles.flex}>
                <Button
                  title={labels.download}
                  variant="secondary"
                  disabled={offline}
                  loading={busy === 'download'}
                  onPress={() => open('download')}
                  trailingIcon={<Download color={tokens.color.primary} size={18} />}
                />
              </View>
              <View style={styles.flex}>
                <Button
                  title={labels.replaceFile}
                  variant="secondary"
                  disabled={offline}
                  loading={busy === 'replace'}
                  onPress={replace}
                  trailingIcon={<RefreshCw color={tokens.color.primary} size={18} />}
                />
              </View>
            </Row>
            <Button
              title={labels.edit}
              variant="secondary"
              onPress={() => router.push(`/document/edit?id=${doc.id}`)}
              trailingIcon={<Pencil color={tokens.color.primary} size={18} />}
            />
          </View>
        }
        side={
          <View style={styles.stack}>
            <Card>
              <Small>Category</Small>
              <Text style={styles.body}>{categoryLabel(doc.category)}</Text>
              <Small>Date added</Small>
              <Text style={styles.body}>{formatDate(doc.created_at)}</Text>
              {doc.notes ? (
                <>
                  <Small>Notes</Small>
                  <Text style={styles.body}>{doc.notes}</Text>
                </>
              ) : null}
              <Small>Linked assets</Small>
              {query.data?.assets.length ? (
                query.data.assets.map((a) => (
                  <Text key={a.id} style={styles.link} onPress={() => router.push(`/asset/edit?id=${a.id}`)}>
                    {a.name}
                  </Text>
                ))
              ) : (
                <Text style={styles.secondary}>None</Text>
              )}
            </Card>

            <Button
              title={labels.delete}
              variant="danger"
              disabled={offline}
              onPress={() => router.push(`/modals/delete-item?kind=document&id=${doc.id}`)}
              trailingIcon={<Trash2 color={tokens.color.surface} size={18} />}
            />
          </View>
        }
      />
      {notice ? <Toast key={notice} message={notice} onHide={() => setNotice(null)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  stack: { gap: tokens.space[4] },
  body: { ...tokens.font.body, color: tokens.color.text },
  secondary: { ...tokens.font.body, color: tokens.color.textSecondary },
  link: {
    ...tokens.font.body,
    color: tokens.color.primary,
    textDecorationLine: 'underline',
    minHeight: tokens.size.touchMin - tokens.space[4],
  },
  previewCard: { alignItems: 'center', minHeight: tokens.size.touchMin * 5 },
  pdf: { alignItems: 'center', gap: tokens.space[4], paddingVertical: tokens.space[6] },
  image: { width: '100%', height: tokens.size.touchMin * 7 },
  actions: { alignItems: 'stretch' },
});
