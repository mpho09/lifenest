import { Lock } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useSession } from '../lib/session';
import { tokens } from '../theme/tokens';
import { Logo } from './Logo';

/** Top bar on tab screens: logo or greeting on the left, lock icon on the right (locks at once → S6). */
export function AppHeader({ greeting }: { greeting?: string }) {
  const { lock } = useSession();
  return (
    <View style={styles.bar}>
      {greeting ? (
        <Text style={styles.greeting} accessibilityRole="header">
          {greeting}
        </Text>
      ) : (
        <Logo />
      )}
      <Pressable accessibilityRole="button" accessibilityLabel="Lock" onPress={lock} style={styles.lock}>
        <Lock color={tokens.color.primary} size={22} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: tokens.space[2] },
  greeting: { ...tokens.font.title, color: tokens.color.text },
  lock: {
    width: tokens.size.touchMin,
    height: tokens.size.touchMin,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -tokens.space[2],
  },
});
