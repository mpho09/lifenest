import { router } from 'expo-router';
import { FilePen, Mail } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';
import { Banner, Card, Header, Screen, SectionTitle, Small, Title } from '../../components/ui';
import { labels, messages } from '../../lib/messages';
import { useInstructions, usePeople } from '../../lib/queries';
import { categoryLabel, INSTRUCTION_SECTIONS } from '../../lib/rules/categories';
import { tokens } from '../../theme/tokens';

/** S15 Instructions and Messages (docs/designs/S15.png): instructions by section, messages by recipient. */
export default function Instructions() {
  const instructions = useInstructions();
  const people = usePeople();
  const all = instructions.data ?? [];
  const items = all.filter((i) => i.kind === 'instruction');
  const msgs = all.filter((i) => i.kind === 'message');
  const contactName = (id: string | null) => people.data?.contacts.find((c) => c.id === id)?.name ?? '';

  return (
    <Screen>
      <Header />
      <Title subtitle="Practical guidance for each section, and private notes to one person.">{labels.instructionsAndMessages}</Title>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Button title={labels.instruction} onPress={() => router.push('/instructions/edit?kind=instruction')} />
        </View>
        <View style={styles.flex}>
          <Button title={labels.personalMessage} variant="secondary" onPress={() => router.push('/instructions/edit?kind=message')} />
        </View>
      </View>

      {instructions.isError && !instructions.data ? (
        <Banner tone="error" text={messages.serverError} actionLabel={labels.tryAgain} onAction={() => instructions.refetch()} />
      ) : instructions.isLoading ? (
        <Card>
          <Skeleton variant="row" />
          <Skeleton variant="row" />
        </Card>
      ) : all.length === 0 ? (
        <EmptyState icon={FilePen} text="Write where things are kept and what to do first." />
      ) : (
        <>
          {INSTRUCTION_SECTIONS.map((s) => {
            const inSection = items.filter((i) => i.section === s.key);
            if (!inSection.length) return null;
            return (
              <View key={s.key} style={styles.group}>
                <SectionTitle>{categoryLabel(s.key)}</SectionTitle>
                {inSection.map((i) => (
                  <Pressable key={i.id} accessibilityRole="button" onPress={() => router.push(`/instructions/edit?id=${i.id}`)}>
                    <Card>
                      <Text style={styles.body} numberOfLines={4}>
                        {i.text}
                      </Text>
                    </Card>
                  </Pressable>
                ))}
              </View>
            );
          })}
          {msgs.length ? <SectionTitle>Personal messages</SectionTitle> : null}
          {msgs.map((m) => {
            const name = contactName(m.recipient_id);
            return (
              <Pressable key={m.id} accessibilityRole="button" onPress={() => router.push(`/instructions/edit?id=${m.id}`)}>
                <Card>
                  <View style={styles.inline}>
                    <Mail color={tokens.color.primary} size={18} />
                    <Text style={styles.bodyStrong}>{name}</Text>
                  </View>
                  <Text style={styles.body} numberOfLines={3}>
                    {m.text}
                  </Text>
                  <Small>{messages.messageOnlyFor(name.split(' ')[0] || name)}</Small>
                </Card>
              </Pressable>
            );
          })}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: tokens.space[2] },
  group: { gap: tokens.space[2] },
  inline: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  body: { ...tokens.font.body, color: tokens.color.text },
  bodyStrong: { ...tokens.font.button, color: tokens.color.text },
});
