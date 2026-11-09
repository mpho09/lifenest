import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ConfirmModal } from '../../components/ConfirmModal';
import { useIsOffline } from '../../components/OfflineBanner';
import { deleteAsset } from '../../lib/api/assets';
import { deleteDocument, getDocument } from '../../lib/api/documents';
import { deleteInstruction } from '../../lib/api/vault';
import { labels, messages } from '../../lib/messages';
import { useRefreshAll } from '../../lib/queries';

const TEXT = {
  document: { title: 'Delete this document?', back: '/documents' },
  asset: { title: 'Delete this asset?', back: '/assets' },
  instruction: { title: 'Delete this?', back: '/instructions' },
} as const;

/** M2 Delete Item (docs/designs/M2.png): deleting is immediate and permanent (BR12). */
export default function DeleteItem() {
  const { kind = 'document', id } = useLocalSearchParams<{ kind?: keyof typeof TEXT; id: string }>();
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const t = TEXT[kind] ?? TEXT.document;

  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (kind === 'document') {
        const found = await getDocument(id);
        if (found) await deleteDocument(found.document);
      } else if (kind === 'asset') {
        await deleteAsset(id);
      } else {
        await deleteInstruction(id);
      }
      await refreshAll();
      if (router.canDismiss()) router.dismissAll();
      router.replace({ pathname: t.back, params: { toast: messages.deleted } } as never);
    } catch {
      setError(messages.serverError);
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      visible
      title={t.title}
      text="This is immediate and permanent. It can’t be undone."
      confirmLabel={labels.delete}
      onConfirm={confirm}
      onCancel={() => router.back()}
      busy={busy}
      error={offline ? messages.offline : error}
      confirmDisabled={offline}
    />
  );
}
