import { router, useLocalSearchParams } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppHeader } from '../../components/AppHeader';
import { Button } from '../../components/Button';
import { AssetRow, CategoryRow } from '../../components/rows';
import { Skeleton } from '../../components/Skeleton';
import { Toast } from '../../components/Toast';
import { Banner, Card, Row, Screen, Title } from '../../components/ui';
import { labels, messages } from '../../lib/messages';
import { useAssets, useRefreshAll } from '../../lib/queries';
import { CATEGORIES } from '../../lib/rules/categories';
import { tokens } from '../../theme/tokens';

/** S11 Assets (docs/designs/S11.png): grouped by category (US6). */
export default function Assets() {
  const { toast } = useLocalSearchParams<{ toast?: string }>();
  const assets = useAssets();
  const refreshAll = useRefreshAll();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const all = assets.data ?? [];

  return (
    <Screen onRefresh={refreshAll} refreshing={assets.isRefetching}>
      <AppHeader />
      <Row style={styles.titleRow}>
        <View style={styles.flex}>
          <Title subtitle={`${all.length} ${all.length === 1 ? 'item' : 'items'}`}>Assets and accounts</Title>
        </View>
        <Button title="Add" onPress={() => router.push('/asset/edit')} trailingIcon={<Plus color={tokens.color.surface} size={18} />} />
      </Row>

      {assets.isError && !assets.data ? (
        <Banner tone="error" text={messages.serverError} actionLabel={labels.tryAgain} onAction={() => assets.refetch()} />
      ) : assets.isLoading ? (
        <Card>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} variant="row" />
          ))}
        </Card>
      ) : (
        CATEGORIES.map((c) => {
          const items = all.filter((a) => a.category === c.key);
          const open = expanded[c.key] ?? items.length > 0;
          return (
            <Card key={c.key}>
              <CategoryRow category={c.key} count={items.length} expanded={open} onToggle={() => setExpanded((e) => ({ ...e, [c.key]: !open }))} />
              {open ? items.map((a) => <AssetRow key={a.id} asset={a} onPress={() => router.push(`/asset/edit?id=${a.id}`)} />) : null}
              {open && items.length === 0 ? (
                <Button title="Add" variant="secondary" onPress={() => router.push(`/asset/edit?category=${c.key}`)} />
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
});
