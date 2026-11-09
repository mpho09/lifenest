import { router, useLocalSearchParams } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { CategoryRow, DocumentRow } from '../../components/rows';
import { Skeleton } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import { Banner, Card, Row, Screen, Title } from '../../components/ui';
import { labels, messages } from '../../lib/messages';
import { useDocuments, useRefreshAll } from '../../lib/queries';
import { CATEGORIES } from '../../lib/rules/categories';
import { tokens } from '../../theme/tokens';

/** S8 Documents (docs/designs/S8.png): grouped by BR2 category, search by title (US5). */
export default function Documents() {
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const documents = useDocuments();
  const refreshAll = useRefreshAll();
  const [typed, setTyped] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Search after 300 ms of no typing, from 2 characters (T-US5-1).
  useEffect(() => {
    const t = setTimeout(() => setSearch(typed.trim().length >= 2 ? typed.trim().toLowerCase() : ''), 300);
    return () => clearTimeout(t);
  }, [typed]);

  const all = useMemo(() => documents.data ?? [], [documents.data]);
  const matches = useMemo(() => (search ? all.filter((d) => d.title.toLowerCase().includes(search)) : all), [all, search]);

  return (
    <Screen onRefresh={refreshAll} refreshing={documents.isRefetching}>
      <AppHeader />
      <Row style={styles.titleRow}>
        <View style={styles.flex}>
          <Title subtitle={`${all.length} ${all.length === 1 ? 'document' : 'documents'}`}>Documents</Title>
        </View>
        <Button
          title="Add"
          onPress={() => router.push('/document/edit')}
          trailingIcon={<Plus color={tokens.color.surface} size={18} />}
        />
      </Row>

      <View style={styles.search}>
        <Search color={tokens.color.textSecondary} size={20} />
        <TextInput
          accessibilityLabel="Search"
          placeholder="Search"
          placeholderTextColor={tokens.color.textSecondary}
          value={typed}
          onChangeText={setTyped}
          style={styles.searchInput}
        />
      </View>

      {documents.isError && !documents.data ? (
        <Banner tone="error" text={messages.serverError} actionLabel={labels.tryAgain} onAction={() => documents.refetch()} />
      ) : documents.isLoading ? (
        <Card>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="row" />
          ))}
        </Card>
      ) : search ? (
        matches.length ? (
          <Card>
            {matches.map((d) => (
              <DocumentRow key={d.id} title={d.title} category={d.category} fileType={d.file_type} createdAt={d.created_at} onPress={() => router.push(`/document/${d.id}`)} />
            ))}
          </Card>
        ) : (
          <EmptyState icon={Search} text={messages.noDocumentsFound} />
        )
      ) : (
        CATEGORIES.map((c) => {
          const docs = all.filter((d) => d.category === c.key);
          const open = expanded[c.key] ?? docs.length > 0;
          return (
            <Card key={c.key}>
              <CategoryRow category={c.key} count={docs.length} expanded={open} onToggle={() => setExpanded((e) => ({ ...e, [c.key]: !open }))} />
              {open
                ? docs.map((d) => (
                    <DocumentRow key={d.id} title={d.title} category={d.category} fileType={d.file_type} createdAt={d.created_at} onPress={() => router.push(`/document/${d.id}`)} />
                  ))
                : null}
              {open && docs.length === 0 ? (
                <Button title="Add" variant="secondary" onPress={() => router.push(`/document/edit?category=${c.key}`)} />
              ) : null}
            </Card>
          );
        })
      )}

      {toast ? <Toast key={toast} message={toast} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  titleRow: { alignItems: 'flex-start' },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    minHeight: tokens.size.touchMin,
    paddingHorizontal: tokens.space[4],
    borderRadius: tokens.radius.input,
    borderWidth: 1,
    borderColor: tokens.color.divider,
    backgroundColor: tokens.color.surface,
  },
  searchInput: { flex: 1, ...tokens.font.body, color: tokens.color.text, minHeight: tokens.size.touchMin },
});
