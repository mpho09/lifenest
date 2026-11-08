import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { tokens } from '../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

type Props = {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Optional icon shown after the title (e.g. the arrow on S1 "Get started"). */
  trailingIcon?: ReactNode;
  testID?: string;
};

const variantStyles = {
  primary: { background: tokens.color.primary, text: tokens.color.surface, border: tokens.color.primary },
  secondary: { background: 'transparent', text: tokens.color.primary, border: tokens.color.primary },
  danger: { background: tokens.color.error, text: tokens.color.surface, border: tokens.color.error },
} as const;

/** Shared button (Section 7.2, T-C-1): 48px high, primary / secondary / danger. */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  trailingIcon,
  testID,
}: Props) {
  const colors = variantStyles[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={inactive ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: colors.background, borderColor: colors.border },
        disabled && styles.disabled,
        pressed && !inactive && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator testID="button-spinner" color={colors.text} />
      ) : (
        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.text }]}>{title}</Text>
          {trailingIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: tokens.size.button,
    borderRadius: tokens.radius.button,
    borderWidth: 1,
    paddingHorizontal: tokens.space[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: tokens.space[2] },
  label: { ...tokens.font.button },
  disabled: { opacity: 0.4 },
  pressed: { opacity: 0.85 },
});
