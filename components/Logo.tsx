import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { labels } from '../lib/messages';
import { tokens } from '../theme/tokens';

const ICON = tokens.space[6] + tokens.space[4]; // 40px

/** Gold nest icon + "LifeNest" wordmark in Lora semibold navy (PRD 9 Logo; docs/designs/logo.png). */
export function Logo() {
  const gold = tokens.color.accent;
  return (
    <View style={styles.row}>
      <Svg width={ICON} height={ICON} viewBox="0 0 40 40" aria-hidden>
        {/* Open ring, gap at the top */}
        <Path d="M14 4.5 A16 16 0 1 0 26 4.5" stroke={gold} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        {/* The egg / person */}
        <Circle cx={20} cy={13} r={3.5} fill={gold} />
        {/* Two nest curves */}
        <Path d="M11 19 Q20 27 29 19" stroke={gold} strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d="M14 24.5 Q20 30 26 24.5" stroke={gold} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      </Svg>
      <Text style={styles.wordmark} accessibilityRole="header">
        {labels.appName}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  wordmark: { ...tokens.font.title, color: tokens.color.primary },
});
