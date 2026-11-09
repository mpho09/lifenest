import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ConfirmModal } from '../../components/ConfirmModal';
import { useIsOffline } from '../../components/OfflineBanner';
import { removeContact } from '../../lib/api/contacts';
import { revokeRelease } from '../../lib/api/vault';
import { labels, messages } from '../../lib/messages';
import { usePeople, useRefreshAll } from '../../lib/queries';

/** M4 Remove Contact or Close Access (docs/designs/M4.png). */
export default function RemoveOrClose() {
  const { mode, id } = useLocalSearchParams<{ mode: 'remove' | 'close'; id?: string }>();
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const people = usePeople();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const name = people.data?.contacts.find((c) => c.id === id)?.name ?? 'this person';

  const close = mode === 'close';

  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    try {
      if (close) await revokeRelease();
      else if (id) await removeContact(id);
      await refreshAll();
      if (router.canDismiss()) router.dismissAll();
      router.replace({ pathname: close ? '/' : '/people', params: { toast: close ? 'Access closed' : 'Removed' } });
    } catch {
      setError(messages.serverError);
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      visible
      title={close ? 'Close access?' : `Remove ${name}?`}
      text={
        close
          ? 'All your trusted contacts lose access at once. They will be told.'
          : 'They will no longer be a trusted contact. Personal messages to them are deleted, and any open request they made is cancelled.'
      }
      confirmLabel={close ? labels.closeAccess : labels.remove}
      onConfirm={confirm}
      onCancel={() => router.back()}
      busy={busy}
      error={offline ? messages.offline : error}
      confirmDisabled={offline}
    />
  );
}
