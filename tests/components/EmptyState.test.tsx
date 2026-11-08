import { fireEvent, render, screen } from '@testing-library/react-native';

import { EmptyState } from '../../components/EmptyState';

const TEXT = 'Let’s start with one thing. Most people begin with their ID.';

describe('EmptyState (T-C-6)', () => {
  it('T-C-6 shows the text and a line illustration, with no button by default', async () => {
    await render(<EmptyState text={TEXT} />);
    expect(screen.getByText(TEXT)).toBeOnTheScreen();
    expect(
      screen.getByTestId('empty-state-illustration', { includeHiddenElements: true }),
    ).toBeOnTheScreen();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('T-C-6 shows an optional button that calls its action', async () => {
    const onPress = jest.fn();
    await render(<EmptyState text={TEXT} buttonLabel="Add an ID document" onButtonPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Add an ID document' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
