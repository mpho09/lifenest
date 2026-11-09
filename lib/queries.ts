import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { getAsset, listAssets } from './api/assets';
import { getAccessHistory, getPeople } from './api/contacts';
import { getDocument, listDocuments } from './api/documents';
import { getProfile, getReadiness, listNotifications } from './api/profile';
import { getEmergencyProfile, getMyOpenRequest, getSharedVault, listInstructions } from './api/vault';
import { useSession } from './session';

/** React Query keys. The last loaded lists stay visible offline (PRD 12). */
export const keys = {
  profile: ['profile'] as const,
  readiness: ['readiness'] as const,
  notifications: ['notifications'] as const,
  documents: ['documents'] as const,
  document: (id: string) => ['document', id] as const,
  assets: ['assets'] as const,
  asset: (id: string) => ['asset', id] as const,
  people: ['people'] as const,
  history: (id: string) => ['history', id] as const,
  instructions: ['instructions'] as const,
  emergency: ['emergency'] as const,
  openRequest: ['openRequest'] as const,
  sharedVault: (ownerId: string) => ['sharedVault', ownerId] as const,
};

function useEnabled() {
  const { session, unlocked } = useSession();
  return !!session && unlocked;
}

export const useProfile = () => useQuery({ queryKey: keys.profile, queryFn: getProfile, enabled: useEnabled() });
export const useReadiness = () => useQuery({ queryKey: keys.readiness, queryFn: getReadiness, enabled: useEnabled() });
export const useNotifications = () =>
  useQuery({ queryKey: keys.notifications, queryFn: listNotifications, enabled: useEnabled(), refetchInterval: 60_000 });
export const useDocuments = () => useQuery({ queryKey: keys.documents, queryFn: () => listDocuments(), enabled: useEnabled() });
export const useDocument = (id: string | undefined) =>
  useQuery({ queryKey: keys.document(id ?? ''), queryFn: () => getDocument(id!), enabled: useEnabled() && !!id });
export const useAssets = () => useQuery({ queryKey: keys.assets, queryFn: listAssets, enabled: useEnabled() });
export const useAsset = (id: string | undefined) =>
  useQuery({ queryKey: keys.asset(id ?? ''), queryFn: () => getAsset(id!), enabled: useEnabled() && !!id });
export const usePeople = () => useQuery({ queryKey: keys.people, queryFn: getPeople, enabled: useEnabled() });
export const useAccessHistory = (id: string | undefined) =>
  useQuery({ queryKey: keys.history(id ?? ''), queryFn: () => getAccessHistory(id!), enabled: useEnabled() && !!id });
export const useInstructions = () => useQuery({ queryKey: keys.instructions, queryFn: listInstructions, enabled: useEnabled() });
export const useEmergencyProfile = () => useQuery({ queryKey: keys.emergency, queryFn: getEmergencyProfile, enabled: useEnabled() });
export const useOpenRequest = () => useQuery({ queryKey: keys.openRequest, queryFn: getMyOpenRequest, enabled: useEnabled() });
export const useSharedVault = (ownerId: string | undefined) =>
  useQuery({
    queryKey: keys.sharedVault(ownerId ?? ''),
    queryFn: () => getSharedVault(ownerId!),
    enabled: useEnabled() && !!ownerId,
    retry: false,
  });

/** After any change: refresh everything that may depend on it (lists, readiness, alerts). */
export function useRefreshAll() {
  const client = useQueryClient();
  return useCallback(() => client.invalidateQueries(), [client]);
}
