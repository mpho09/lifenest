import { fireEvent, render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Button } from '../../components/Button';
import { tokens } from '../../theme/tokens';

const styleOf = (el: { props: { style?: unknown } }) =>
  StyleSheet.flatten(el.props.style as Parameters<typeof StyleSheet.flatten>[0]) ?? {};

describe('Button (T-C-1)', () => {
  it.each([
    ['primary', tokens.color.primary],
    ['secondary', 'transparent'],
    ['danger', tokens.color.error],
  ] as const)('T-C-1 renders the %s variant', async (variant, background) => {
    await render(<Button title="Save" variant={variant} onPress={() => {}} />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(styleOf(button).backgroundColor).toBe(background);
  });

  it('T-C-1 calls onPress when enabled', async () => {
    const onPress = jest.fn();
    await render(<Button title="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('T-C-1 disabled cannot be pressed', async () => {
    const onPress = jest.fn();
    await render(<Button title="Save" disabled onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Save' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });

  it('T-C-1 loading shows a spinner and blocks presses', async () => {
    const onPress = jest.fn();
    await render(<Button title="Save" loading onPress={onPress} />);
    expect(screen.getByTestId('button-spinner')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('T-C-1 height is 48', async () => {
    await render(<Button title="Save" onPress={() => {}} />);
    expect(styleOf(screen.getByRole('button', { name: 'Save' })).height).toBe(48);
  });
});
