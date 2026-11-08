import { act, render, screen } from '@testing-library/react-native';

import { Toast } from '../../components/Toast';

describe('Toast (T-C-4)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('T-C-4 shows the text and disappears after 3 seconds', async () => {
    const onHide = jest.fn();
    await render(<Toast message="Saved" onHide={onHide} />);
    expect(screen.getByText('Saved')).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(2999);
    });
    expect(screen.getByText('Saved')).toBeOnTheScreen();

    await act(async () => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.queryByText('Saved')).toBeNull();
    expect(onHide).toHaveBeenCalledTimes(1);
  });
});
