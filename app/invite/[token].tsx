import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { INVITE_TOKEN_KEY } from '../../lib/invite';
import { lockStorage } from '../../lib/lock/storage';
import { useSession } from '../../lib/session';

/**
 * Invite link handler (Section 11): keeps the token on the device, then goes
 * to S2 in invite mode when logged out, or S13 People when logged in.
 */
export default function InviteLink() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { ready, session } = useSession();
  const [stored, setStored] = useState(false);

  useEffect(() => {
    if (token) lockStorage.set(INVITE_TOKEN_KEY, token).then(() => setStored(true));
  }, [token]);

  if (!ready || !stored) return null;
  if (!session) return <Redirect href={{ pathname: '/sign-up', params: { invite: token } }} />;
  return <Redirect href="/people" />;
}
