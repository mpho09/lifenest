import { Delete, Fingerprint } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { labels } from '../lib/messages';
import { useReduceMotion } from '../theme/motion';
import { tokens } from '../theme/tokens';

const PIN_LENGTH = 6;
const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

type Props = {
  onComplete: (pin: string) => void;
  showFingerprint?: boolean;
  onFingerprint?: () => void;
  /** Change this number to play the error shake (e.g. after a wrong PIN). */
  errorCount?: number;
};

/** 6-digit PIN pad (Section 7.2, T-C-3). The PIN never leaves this component except via onComplete. */
export function PinPad({ onComplete, showFingerprint = false, onFingerprint, errorCount = 0 }: Props) {
  const [digits, setDigits] = useState('');
  const [shake] = useState(() => new Animated.Value(0));
  const reduceMotion = useReduceMotion();

  useEffect(() => {
    if (errorCount === 0 || reduceMotion) return;
    const step = tokens.space[2];
    Animated.sequence(
      [step, -step, step, -step, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 60, useNativeDriver: true }),
      ),
    ).start();
  }, [errorCount, reduceMotion, shake]);

  const press = (digit: string) => {
    const next = digits + digit;
    if (next.length < PIN_LENGTH) {
      setDigits(next);
      return;
    }
    setDigits('');
    onComplete(next);
  };

  const remove = () => setDigits((d) => d.slice(0, -1));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[styles.dots, { transform: [{ translateX: shake }] }]}
        accessibilityLabel={`${digits.length} of ${PIN_LENGTH}`}
      >
        {Array.from({ length: PIN_LENGTH }, (_, i) => {
          const filled = i < digits.length;
          return (
            <View
              key={i}
              testID={filled ? 'pin-dot-filled' : 'pin-dot-empty'}
              style={[styles.dot, filled && styles.dotFilled]}
            />
          );
        })}
      </Animated.View>

      <View style={styles.grid}>
        {KEYS.map((k) => (
          <Key key={k} label={k} onPress={() => press(k)}>
            <Text style={styles.keyText}>{k}</Text>
          </Key>
        ))}
        {showFingerprint && onFingerprint ? (
          <Key label={labels.useFingerprint} onPress={onFingerprint}>
            <Fingerprint color={tokens.color.primary} size={28} />
          </Key>
        ) : (
          <View style={styles.key} />
        )}
        <Key label="0" onPress={() => press('0')}>
          <Text style={styles.keyText}>0</Text>
        </Key>
        <Key label={labels.deleteKey} onPress={remove}>
          <Delete color={tokens.color.primary} size={28} />
        </Key>
      </View>
    </View>
  );
}

function Key({ label, onPress, children }: { label: string; onPress: () => void; children: React.ReactNode }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
    >
      {children}
    </Pressable>
  );
}

const DOT = tokens.space[4] - tokens.space[1]; // 12px dot

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: tokens.space[6] },
  dots: { flexDirection: 'row', gap: tokens.space[4] },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: tokens.radius.circle,
    borderWidth: 1.5,
    borderColor: tokens.color.primary,
  },
  dotFilled: { backgroundColor: tokens.color.primary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: (tokens.size.touchMin + tokens.space[6]) * 3 + tokens.space[4] * 2,
    gap: tokens.space[4],
  },
  key: {
    width: tokens.size.touchMin + tokens.space[6],
    height: tokens.size.touchMin + tokens.space[4],
    borderRadius: tokens.radius.circle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPressed: { backgroundColor: tokens.color.placeholder },
  keyText: { ...tokens.font.title, fontFamily: tokens.font.family.regular, color: tokens.color.text },
});
