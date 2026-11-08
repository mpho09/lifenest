import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { Skeleton } from '../../components/Skeleton';
import { tokens } from '../../theme/tokens';

describe('Skeleton (T-C-7)', () => {
  it('T-C-7 renders a ring shape (grey ring outline)', async () => {
    await render(<Skeleton variant="ring" />);
    const ring = screen.getByTestId('skeleton-ring');
    const style = StyleSheet.flatten(ring.props.style);
    expect(style.borderColor).toBe(tokens.color.placeholder);
    expect(style.borderRadius).toBe(tokens.radius.circle);
  });

  it('T-C-7 renders a line shape', async () => {
    await render(<Skeleton variant="line" />);
    const line = screen.getByTestId('skeleton-line');
    expect(StyleSheet.flatten(line.props.style).backgroundColor).toBe(tokens.color.placeholder);
  });

  it('T-C-7 renders a row shape', async () => {
    await render(<Skeleton variant="row" />);
    expect(screen.getByTestId('skeleton-row')).toBeOnTheScreen();
  });

  it('T-C-7 has the accessibility label "Loading"', async () => {
    await render(<Skeleton variant="line" />);
    expect(screen.getByLabelText('Loading')).toBeOnTheScreen();
  });
});
