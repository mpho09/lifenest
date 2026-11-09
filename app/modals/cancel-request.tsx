import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { ConfirmModal } from '../../components/ConfirmModal';
import { useIsOffline } from '../../components/OfflineBanner';
import { cancelAccessRequest } from '../../lib/api/vault';
import { labels, messages } from '../../lib/messages';
import { useRefreshAll } from '../../lib/queries';

/** M3 Cancel Request (docs/designs/M3.png): "I'm OK" (US12). */
export default function CancelRequest() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const confirm = async () => {
    setBusy(true);
    setError(undefined);
    try {
      await cancelAccessRequest(id);
      await refreshAll();
      if (router.canDismiss()) router.dismissAll();
      router.replace({ pathname: '/', params: { toast: messages.requestCancelled } });
    } catch {
      setError(messages.serverError);
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      visible
      title="Cancel this request?"
      text="Nothing will be shared. The person who asked will be told."
      confirmLabel={labels.yesCancel}
      cancelLabel="Back"
      onConfirm={confirm}
      onCancel={() => router.back()}
      busy={busy}
      error={offline ? messages.offline : error}
      confirmDisabled={offline}
    />
  );
}
