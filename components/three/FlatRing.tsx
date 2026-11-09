import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { messages } from '../../lib/messages';
import { tokens } from '../../theme/tokens';

export const RING_SEGMENTS = 8;
const SIZE = 200;
const R = 80;
const GAP_DEG = 6;

function arc(startDeg: number, endDeg: number): string {
  const rad = (d: number) => ((d - 90) * Math.PI) / 180;
  const [x1, y1] = [100 + R * Math.cos(rad(startDeg)), 100 + R * Math.sin(rad(startDeg))];
  const [x2, y2] = [100 + R * Math.cos(rad(endDeg)), 100 + R * Math.sin(rad(endDeg))];
  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`;
}

/** Flat SVG readiness ring with the same 8 segments and text (Section 7.4 fallback). */
export function FlatRing({ done }: { done: number }) {
  const step = 360 / RING_SEGMENTS;
  return (
    <View testID="flat-ring" style={styles.wrapper} accessible accessibilityRole="image" accessibilityLabel={`Readiness: ${messages.readinessCount(done)}`}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {Array.from({ length: RING_SEGMENTS }, (_, i) => (
          <Path
            key={i}
            d={arc(i * step + GAP_DEG / 2, (i + 1) * step - GAP_DEG / 2)}
            stroke={i < done ? tokens.color.three.gold : tokens.color.placeholder}
            strokeWidth={14}
            strokeLinecap="round"
            fill="none"
          />
        ))}
      </Svg>
      <RingLabel done={done} />
    </View>
  );
}

/** "5 of 8 done" in the centre: always a normal Text, never drawn in 3D (Section 7.4). */
export function RingLabel({ done }: { done: number }) {
  return (
    <View style={styles.center} pointerEvents="none">
      <Text style={styles.count}>{messages.readinessCount(done)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: SIZE, height: SIZE, alignSelf: 'center' },
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  count: { ...tokens.font.title, color: tokens.color.text },
});
