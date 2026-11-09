import { useState } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';

import { labels } from '../lib/messages';
import { tokens } from '../theme/tokens';
import { Button } from './Button';
import { TextField } from './TextField';

type Props = {
  visible: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** When set (e.g. "DELETE"), the danger button stays disabled until this exact word is typed. */
  typeToConfirm?: string;
  typeToConfirmLabel?: string;
  busy?: boolean;
  error?: string;
  /** Disables the danger button, e.g. while offline. */
  confirmDisabled?: boolean;
};

/** Confirmation modal used by M1–M4 (Section 7.2, T-C-8). */
export function ConfirmModal({ visible, onCancel, ...rest }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* Mounted only while visible, so the typed word resets each time the modal opens. */}
      {visible && <ConfirmSheet onCancel={onCancel} {...rest} />}
    </Modal>
  );
}

function ConfirmSheet({
  title,
  text,
  confirmLabel,
  cancelLabel = labels.cancel,
  onConfirm,
  onCancel,
  typeToConfirm,
  typeToConfirmLabel,
  busy = false,
  error,
  confirmDisabled = false,
}: Omit<Props, 'visible'>) {
  const [typed, setTyped] = useState('');
  const typedOk = typeToConfirm === undefined || typed === typeToConfirm;

  return (
    <View style={styles.scrim}>
      <View style={styles.sheet} accessibilityViewIsModal>
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text style={styles.text}>{text}</Text>
        {typeToConfirm !== undefined && (
          <TextField
            label={typeToConfirmLabel ?? typeToConfirm}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
          />
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title={confirmLabel}
          variant="danger"
          onPress={onConfirm}
          disabled={!typedOk || confirmDisabled}
          loading={busy}
        />
        <Button title={cancelLabel} variant="secondary" onPress={onCancel} disabled={busy} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    justifyContent: 'center',
    padding: tokens.space.screen,
    backgroundColor: `${tokens.color.text}7A`, // color.text at 48% opacity (DESIGN.md modal scrim)
  },
  sheet: {
    width: '100%',
    maxWidth: tokens.layout.narrow * 0.75,
    alignSelf: 'center',
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.card,
    padding: tokens.space[6],
    gap: tokens.space[4],
    boxShadow: tokens.shadow.card,
  },
  title: { ...tokens.font.title, color: tokens.color.text },
  text: { ...tokens.font.body, color: tokens.color.textSecondary },
  error: { ...tokens.font.small, color: tokens.color.error },
});
