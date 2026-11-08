import { fireEvent, render, screen } from '@testing-library/react-native';

import { PinPad } from '../../components/PinPad';

const press = (label: string) => fireEvent.press(screen.getByRole('button', { name: label }));

describe('PinPad (T-C-3)', () => {
  it('T-C-3 shows 6 empty dots that fill as digits are pressed', async () => {
    await render(<PinPad onComplete={() => {}} />);
    expect(screen.getAllByTestId('pin-dot-empty')).toHaveLength(6);
    await press('1');
    await press('2');
    expect(screen.getAllByTestId('pin-dot-filled')).toHaveLength(2);
    expect(screen.getAllByTestId('pin-dot-empty')).toHaveLength(4);
  });

  it('T-C-3 delete removes one digit', async () => {
    await render(<PinPad onComplete={() => {}} />);
    await press('1');
    await press('2');
    await press('Delete');
    expect(screen.getAllByTestId('pin-dot-filled')).toHaveLength(1);
  });

  it('T-C-3 completes after 6 digits with the PIN, then clears', async () => {
    const onComplete = jest.fn();
    await render(<PinPad onComplete={onComplete} />);
    for (const digit of ['1', '2', '3', '4', '5', '6']) await press(digit);
    expect(onComplete).toHaveBeenCalledWith('123456');
    expect(screen.getAllByTestId('pin-dot-empty')).toHaveLength(6);
  });

  it('T-C-3 shows the fingerprint key only when enabled', async () => {
    const onFingerprint = jest.fn();
    const { rerender } = await render(<PinPad onComplete={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Use fingerprint' })).toBeNull();
    await rerender(<PinPad onComplete={() => {}} showFingerprint onFingerprint={onFingerprint} />);
    await press('Use fingerprint');
    expect(onFingerprint).toHaveBeenCalledTimes(1);
  });
});
