import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { TextField } from '../../components/TextField';
import { tokens } from '../../theme/tokens';

const PASSWORD_RULE = 'At least 10 characters, including a number and a letter.';

describe('TextField (T-C-2)', () => {
  it('T-C-2 shows the error text and a red border when error is set', async () => {
    await render(<TextField label="Password" value="" onChangeText={() => {}} error={PASSWORD_RULE} />);
    expect(screen.getByText(PASSWORD_RULE)).toBeOnTheScreen();
    const box = screen.getByTestId('text-field-box');
    expect(StyleSheet.flatten(box.props.style).borderColor).toBe(tokens.color.error);
  });

  it('T-C-2 has no error text and a normal border without error', async () => {
    await render(<TextField label="Email" value="" onChangeText={() => {}} />);
    const box = screen.getByTestId('text-field-box');
    expect(StyleSheet.flatten(box.props.style).borderColor).toBe(tokens.color.divider);
  });

  it('T-C-2 the eye icon toggles password visibility', async () => {
    await render(<TextField label="Password" value="secret1234" onChangeText={() => {}} password />);
    const input = screen.getByLabelText('Password');
    expect(input.props.secureTextEntry).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: 'Show password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
    await fireEvent.press(screen.getByRole('button', { name: 'Hide password' }));
    expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('T-C-2 multiline shows the "12 / 2,000" counter', async () => {
    await render(
      <TextField
        label="Text"
        value="Twelve chars"
        onChangeText={() => {}}
        multiline
        maxLength={2000}
      />,
    );
    expect(screen.getByText('12 / 2,000')).toBeOnTheScreen();
  });

  it('T-C-2 passes typed text to onChangeText', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Email" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Email'), 'lerato@example.com');
    expect(onChangeText).toHaveBeenCalledWith('lerato@example.com');
  });
});
