import { useNetInfo } from '@react-native-community/netinfo';
import { WifiOff } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { messages } from '../lib/messages';
import { tokens } from '../theme/tokens';

/** True only when the phone is known to be offline (unknown counts as online). */
export function useIsOffline(): boolean {
  const { isConnected } = useNetInfo();
  return isConnected === false;
}

/** Grey bar shown on every logged-in screen while offline (Section 7.2, T-C-5). */
export function OfflineBanner() {
  const offline = useIsOffline();
  if (!offline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert" accessibilityLiveRegion="polite">
      <WifiOff color={tokens.color.text} size={16} />
      <Text style={styles.text}>{messages.offline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[2],
    backgroundColor: tokens.color.placeholder,
    paddingHorizontal: tokens.space.screen,
    paddingVertical: tokens.space[2],
  },
  text: { ...tokens.font.small, color: tokens.color.text, flex: 1 },
});
