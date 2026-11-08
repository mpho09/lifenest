import { StyleSheet, View } from 'react-native';

import { labels } from '../lib/messages';
import { tokens } from '../theme/tokens';

type Props = { variant: 'ring' | 'line' | 'row' };

const RING_SIZE = tokens.size.touchMin * 3; // 144px placeholder ring
const LINE_HEIGHT = tokens.space[4] - tokens.space[1]; // 12px bar

/** Grey loading placeholders (Section 7.2, T-C-7). */
export function Skeleton({ variant }: Props) {
  return (
    <View accessible accessibilityLabel={labels.loading}>
      {variant === 'ring' && <View testID="skeleton-ring" style={styles.ring} />}
      {variant === 'line' && <View testID="skeleton-line" style={styles.line} />}
      {variant === 'row' && (
        <View testID="skeleton-row" style={styles.row}>
          <View style={styles.circle} />
          <View style={styles.rowLines}>
            <View style={styles.line} />
            <View style={[styles.line, styles.shortLine]} />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: tokens.radius.circle,
    borderWidth: tokens.space[4] - tokens.space[1],
    borderColor: tokens.color.placeholder,
    alignSelf: 'center',
  },
  line: {
    height: LINE_HEIGHT,
    borderRadius: tokens.radius.input,
    backgroundColor: tokens.color.placeholder,
  },
  shortLine: { width: '60%' },
  row: {
    minHeight: tokens.size.touchMin + tokens.space[2],
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.space[4],
  },
  circle: {
    width: tokens.size.touchMin - tokens.space[2],
    height: tokens.size.touchMin - tokens.space[2],
    borderRadius: tokens.radius.circle,
    backgroundColor: tokens.color.placeholder,
  },
  rowLines: { flex: 1, gap: tokens.space[2] },
});
