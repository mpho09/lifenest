import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmModal } from '../../components/ConfirmModal';
import { useIsOffline } from '../../components/OfflineBanner';
import { deleteAccount } from '../../lib/api/auth';
import { labels, messages } from '../../lib/messages';
import { useSession } from '../../lib/session';

/** M1 Delete Account (docs/designs/M1.png): type DELETE to confirm (PRD 5, BR12). */
export default function DeleteAccount() {
  const { userId } = useSession();
  const offline = useIsOffline();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const confirm = async () => {
    if (!userId) return;
    setBusy(true);
    setError(undefined);
    try {
      await deleteAccount(userId);
      router.replace('/welcome');
    } catch {
      setError(messages.serverError);
      setBusy(false);
    }
  };

  return (
    <ConfirmModal
      visible
      title="Delete your account?"
      text="This immediately and permanently deletes your whole vault and ends every trusted-contact link."
      confirmLabel={labels.delete}
      typeToConfirm="DELETE"
      typeToConfirmLabel="Type DELETE to confirm"
      onConfirm={confirm}
      onCancel={() => router.back()}
      busy={busy}
      error={offline ? messages.offline : error}
      confirmDisabled={offline}
    />
  );
}
