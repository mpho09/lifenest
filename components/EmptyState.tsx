import { FolderOpen, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '../theme/tokens';
import { Button } from './Button';

type Props = {
  text: string;
  /** Line illustration (a Lucide outline icon); PRD 9: no stock photos. */
  icon?: LucideIcon;
  buttonLabel?: string;
  onButtonPress?: () => void;
};

/** Empty-list state: line illustration, text, optional button (Section 7.2, T-C-6). */
export function EmptyState({ text, icon: Icon = FolderOpen, buttonLabel, onButtonPress }: Props) {
  return (
    <View style={styles.wrapper}>
      <View testID="empty-state-illustration" aria-hidden>
        <Icon color={tokens.color.accent} size={tokens.size.touchMin + tokens.space[4]} strokeWidth={1.25} />
      </View>
      <Text style={styles.text}>{text}</Text>
      {buttonLabel && onButtonPress ? <Button title={buttonLabel} onPress={onButtonPress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: tokens.space[4],
    paddingHorizontal: tokens.space.screen,
    paddingVertical: tokens.space[6],
  },
  text: { ...tokens.font.body, color: tokens.color.textSecondary, textAlign: 'center' },
});
