import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { labels } from '../../lib/messages';
import { tokens } from '../../theme/tokens';

const BOLTS = 8;

/** Flat SVG of the closed vault door, no motion (Section 7.4 fallback for S1). */
export function FlatVault() {
  const { navy, gold } = tokens.color.three;
  return (
    <View
      testID="flat-vault"
      style={styles.wrapper}
      accessible
      accessibilityRole="image"
      accessibilityLabel={labels.vaultDoor}
    >
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        <Circle cx={100} cy={100} r={84} fill={navy} />
        <Circle cx={100} cy={100} r={84} fill="none" stroke={gold} strokeWidth={4} />
        {Array.from({ length: BOLTS }, (_, i) => {
          const a = (i / BOLTS) * Math.PI * 2;
          return <Circle key={i} cx={100 + Math.cos(a) * 66} cy={100 + Math.sin(a) * 66} r={5} fill={gold} />;
        })}
        <Circle cx={100} cy={100} r={30} fill="none" stroke={gold} strokeWidth={5} />
        <Line x1={100} y1={70} x2={100} y2={130} stroke={gold} strokeWidth={5} />
        <Line x1={70} y1={100} x2={130} y2={100} stroke={gold} strokeWidth={5} />
        <Circle cx={100} cy={100} r={9} fill={gold} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, aspectRatio: 1, alignSelf: 'center' },
});
