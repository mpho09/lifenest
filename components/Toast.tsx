import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tokens } from '../theme/tokens';

export const TOAST_DURATION_MS = 3000;

type Props = {
  message: string;
  onHide?: () => void;
};

/**
 * One-line toast on a dark background that disappears after 3 seconds
 * (Section 7.2, T-C-4). To show a new toast, mount a new one (e.g. with a new `key`).
 */
export function Toast({ message, onHide }: Props) {
  const [visible, setVisible] = useState(true);
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onHideRef.current?.();
    }, TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <View style={styles.toast} accessibilityLiveRegion="polite" accessibilityRole="alert">
      <Text style={styles.text} numberOfLines={1}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: tokens.space.screen,
    right: tokens.space.screen,
    bottom: tokens.space[6],
    backgroundColor: tokens.color.toastBackground,
    borderRadius: tokens.radius.button,
    paddingHorizontal: tokens.space[4],
    paddingVertical: tokens.space[4] - tokens.space[1],
    boxShadow: tokens.shadow.card,
  },
  text: { ...tokens.font.body, color: tokens.color.surface },
});
