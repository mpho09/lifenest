import { router, useLocalSearchParams } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import { useState } from 'react';

import { Button } from '../../components/Button';
import { useIsOffline } from '../../components/OfflineBanner';
import { TextField } from '../../components/TextField';
import { Banner, Card, Choices, Header, Screen, SectionTitle, Small, Title } from '../../components/ui';
import { saveAsset } from '../../lib/api/assets';
import { messageForError } from '../../lib/errors';
import { labels, messages } from '../../lib/messages';
import { useAsset, useDocuments, useRefreshAll } from '../../lib/queries';
import { assetFieldsForType, isValidLast4, notesPasswordWarning } from '../../lib/rules/asset';
import { ASSET_TYPES, CATEGORIES, isCategory, type AssetType, type Category } from '../../lib/rules/categories';
import { tokens } from '../../theme/tokens';

/** S12 Add or Edit Asset (docs/designs/S12.png), BR3. */
export default function EditAsset() {
  const params = useLocalSearchParams<{ id?: string; category?: string; type?: string }>();
  const editing = !!params.id;
  const existing = useAsset(params.id);
  const documents = useDocuments();
  const offline = useIsOffline();
  const refreshAll = useRefreshAll();

  const [category, setCategory] = useState<Category | null>(params.category && isCategory(params.category) ? params.category : null);
  const [type, setType] = useState<AssetType | null>(
    ASSET_TYPES.some((t) => t.key === params.type) ? (params.type as AssetType) : null,
  );
  const [name, setName] = useState('');
  const [provider, setProvider] = useState('');
  const [providerPhone, setProviderPhone] = useState('');
  const [reference, setReference] = useState('');
  const [last4, setLast4] = useState('');
  const [originals, setOriginals] = useState('');
  const [notes, setNotes] = useState('');
  const [linked, setLinked] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const a = existing.data;
  // Copy loaded data into the form once per loaded item (React: adjust state while rendering).
  const [loadedKey, setLoadedKey] = useState<unknown>(null);
  if (a && loadedKey !== a.id) {
    setLoadedKey(a.id);
    setCategory(a.category);
    setType(a.type);
    setName(a.name);
    setProvider(a.provider ?? '');
    setProviderPhone(a.provider_phone ?? '');
    setReference(a.reference_number ?? '');
    setLast4(a.last4 ?? '');
    setOriginals(a.originals_location ?? '');
    setNotes(a.notes ?? '');
    setLinked(a.document_ids);
  }

  const fields = type ? assetFieldsForType(type) : { last4: false, referenceNumber: true };
  const last4Error = fields.last4 && last4 !== '' && !isValidLast4(last4);
  const warning = notesPasswordWarning(notes);
  const valid = !!category && !!type && name.trim().length > 0 && !last4Error;

  const save = async () => {
    if (!category || !type) return;
    setBusy(true);
    setError(null);
    try {
      await saveAsset(
        params.id ?? null,
        {
          category,
          type,
          name,
          provider,
          provider_phone: providerPhone,
          reference_number: fields.referenceNumber ? reference : null,
          last4: fields.last4 ? last4 : null,
          originals_location: originals,
          notes,
        },
        linked,
      );
      await refreshAll();
      router.replace({ pathname: '/assets', params: { toast: messages.saved } });
    } catch (e) {
      setError(messageForError(e as never));
    } finally {
      setBusy(false);
    }
  };

  const docs = documents.data ?? [];
  const toggle = (id: string) => setLinked((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  return (
    <Screen footer={<Button title={labels.save} onPress={save} loading={busy} disabled={!valid || offline} />}>
      <Header />
      <Title>{editing ? 'Edit asset' : 'Add an asset'}</Title>
      {error ? <Banner tone="error" text={error} /> : null}
      {a?.deleted_document_count ? <Banner tone="warning" text={messages.documentDeleted} /> : null}

      <Choices label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
      <Choices label="Type" options={ASSET_TYPES} value={type} onChange={setType} />
      <TextField label="Name" value={name} onChangeText={setName} maxLength={80} placeholder="e.g. House in Faerie Glen" />
      <TextField label="Provider (optional)" value={provider} onChangeText={setProvider} maxLength={80} />
      <TextField label="Provider phone (optional)" value={providerPhone} onChangeText={setProviderPhone} maxLength={15} keyboardType="phone-pad" />
      {fields.last4 ? (
        <TextField
          label="Last 4 digits"
          value={last4}
          onChangeText={(v) => setLast4(v.replace(/\s/g, '').slice(0, 4))}
          keyboardType="number-pad"
          maxLength={4}
          error={last4Error ? messages.last4Only : undefined}
        />
      ) : (
        <TextField label="Policy or membership number (optional)" value={reference} onChangeText={setReference} maxLength={30} />
      )}
      <TextField label="Where the originals are kept (optional)" value={originals} onChangeText={setOriginals} maxLength={200} />
      <TextField label="Notes (optional)" value={notes} onChangeText={setNotes} multiline maxLength={500} />
      {warning ? <Banner tone="warning" text={warning} /> : null}

      <SectionTitle>Documents</SectionTitle>
      <Card>
        {linked.length ? (
          <Choices
            options={docs.filter((d) => linked.includes(d.id)).map((d) => ({ key: d.id, label: d.title }))}
            value={linked}
            onChange={toggle}
            multiple
          />
        ) : (
          <Small>None</Small>
        )}
        <Button title={labels.linkDocument} variant="secondary" onPress={() => setShowPicker((s) => !s)} />
        {showPicker ? (
          docs.length ? (
            <Choices options={docs.map((d) => ({ key: d.id, label: d.title }))} value={linked} onChange={toggle} multiple />
          ) : (
            <Small>{messages.noDocumentsFound}</Small>
          )
        ) : null}
      </Card>

      {editing && params.id ? (
        <Button
          title={labels.delete}
          variant="danger"
          disabled={offline}
          onPress={() => router.push(`/modals/delete-item?kind=asset&id=${params.id}`)}
          trailingIcon={<Trash2 color={tokens.color.surface} size={18} />}
        />
      ) : null}
    </Screen>
  );
}

