import { Eye, EyeOff } from 'lucide-react-native';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type TextInputProps,
} from 'react-native';

import { labels } from '../lib/messages';
import { formatCount } from '../lib/rules/format';
import { tokens } from '../theme/tokens';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  error?: string;
  /** Password field with an eye toggle. */
  password?: boolean;
  /** Multiline; with `maxLength` it shows a "12 / 2,000" counter. */
  multiline?: boolean;
  maxLength?: number;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoComplete?: TextInputProps['autoComplete'];
  testID?: string;
};

/** Shared text field (Section 7.2, T-C-2). */
export function TextField({
  label,
  value,
  onChangeText,
  onBlur,
  error,
  password = false,
  multiline = false,
  maxLength,
  placeholder,
  editable = true,
  keyboardType,
  autoCapitalize,
  autoComplete,
  testID,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  const borderColor = error
    ? tokens.color.error
    : focused
      ? tokens.color.primary
      : tokens.color.divider;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        testID="text-field-box"
        style={[
          styles.box,
          multiline && styles.multilineBox,
          { borderColor, borderWidth: error || focused ? 1.5 : 1 },
          !editable && styles.locked,
        ]}
      >
        <TextInput
          testID={testID}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            onBlur?.();
          }}
          secureTextEntry={password && hidden}
          multiline={multiline}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={tokens.color.textSecondary}
          editable={editable}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? (password ? 'none' : undefined)}
          autoComplete={autoComplete}
          style={[styles.input, multiline && styles.multilineInput]}
        />
        {password && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? labels.showPassword : labels.hidePassword}
            onPress={() => setHidden((h) => !h)}
            hitSlop={tokens.space[2]}
            style={styles.eye}
          >
            {hidden ? (
              <Eye color={tokens.color.textSecondary} size={20} />
            ) : (
              <EyeOff color={tokens.color.textSecondary} size={20} />
            )}
          </Pressable>
        )}
      </View>
      <View style={styles.footer}>
        {error ? <Text style={styles.error}>{error}</Text> : <View />}
        {multiline && maxLength !== undefined && (
          <Text style={styles.counter}>
            {formatCount(value.length)} / {formatCount(maxLength)}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: tokens.space[1] },
  label: { ...tokens.font.small, color: tokens.color.text },
  box: {
    minHeight: tokens.size.touchMin,
    borderRadius: tokens.radius.input,
    backgroundColor: tokens.color.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.space[4],
  },
  multilineBox: { alignItems: 'flex-start', paddingVertical: tokens.space[2] },
  locked: { backgroundColor: tokens.color.background },
  input: { flex: 1, ...tokens.font.body, color: tokens.color.text },
  multilineInput: { minHeight: tokens.size.touchMin * 3, textAlignVertical: 'top' },
  eye: {
    minWidth: tokens.size.touchMin,
    minHeight: tokens.size.touchMin,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: tokens.space[2] },
  error: { ...tokens.font.small, color: tokens.color.error, flex: 1 },
  counter: { ...tokens.font.small, color: tokens.color.textSecondary },
});
