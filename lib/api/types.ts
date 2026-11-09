import type { AccessLevel, AssetType, Category } from '../rules/categories';

export type VaultStatus = 'normal' | 'request_open' | 'released';

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  owns_no_property_or_vehicle: boolean;
  last_reviewed_at: string;
  vault_status: VaultStatus;
};

export type DocumentRow = {
  id: string;
  title: string;
  category: Category;
  file_path: string;
  file_type: 'pdf' | 'jpg' | 'png';
  size_kb: number;
  notes: string | null;
  created_at: string;
};

export type AssetRow = {
  id: string;
  category: Category;
  type: AssetType;
  name: string;
  provider: string | null;
  provider_phone: string | null;
  reference_number: string | null;
  last4: string | null;
  originals_location: string | null;
  notes: string | null;
  deleted_document_count: number;
  document_ids: string[];
};

export type ContactStatus = 'invited' | 'accepted' | 'declined' | 'expired';

export type Contact = {
  id: string;
  name: string;
  relationship: string;
  email: string;
  phone: string | null;
  access_level: AccessLevel;
  allowed_sections: string[];
  status: ContactStatus;
  invite_expires_at: string;
};

export type SharedWithMe = { owner_id: string; owner_name: string; access_level: AccessLevel; vault_status: VaultStatus };
export type InviteToMe = {
  id: string;
  token: string;
  owner_name: string;
  access_level: AccessLevel;
  expires_at: string;
  expired: boolean;
};
export type People = { contacts: Contact[]; shared_with_me: SharedWithMe[]; invites: InviteToMe[] };

export type Instruction = {
  id: string;
  kind: 'instruction' | 'message';
  section: string | null;
  recipient_id: string | null;
  text: string;
  updated_at: string;
};

export type EmergencyContact = { name: string; relationship: string; phone: string };
export type EmergencyProfile = {
  emergency_contacts: EmergencyContact[];
  medical_aid_provider: string | null;
  medical_aid_number: string | null;
  key_notes: string | null;
  share_now: boolean;
};

export type RequestStatus = 'submitted' | 'verified' | 'rejected' | 'cancelled' | 'released' | 'revoked';

export type SharedVault = {
  owner_id: string;
  owner_name: string;
  access_level: AccessLevel;
  allowed_sections: string[];
  vault_status: VaultStatus;
  other_request_open: boolean;
  my_request: {
    id: string;
    status: RequestStatus;
    reason: string;
    submitted_at: string;
    waiting_ends_at: string;
    released_at: string | null;
  } | null;
  emergency_profile: (Omit<EmergencyProfile, 'share_now'> & { updated_at: string }) | null;
  documents: { id: string; title: string; category: Category; file_type: string; created_at: string; notes: string | null }[];
  assets: Omit<AssetRow, 'deleted_document_count' | 'document_ids'>[];
  instructions: { id: string; section: string; text: string; updated_at: string }[];
  messages: { id: string; text: string; updated_at: string }[];
};

export type OpenRequest = {
  id: string;
  status: RequestStatus;
  reason: 'death' | 'incapacity';
  submitted_at: string;
  waiting_ends_at: string;
  released_at: string | null;
  requester_name: string;
};

export type Readiness = { items: { key: string; done: boolean }[]; done: number };

export type Notification = {
  id: string;
  type: string;
  text: string;
  link_target: string | null;
  is_read: boolean;
  created_at: string;
};

export type AccessHistoryEntry = { id: number; action: string; created_at: string; item_title: string | null };
