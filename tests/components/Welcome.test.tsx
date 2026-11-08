import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import Welcome from '../../app/(auth)/welcome';
import { resetScene3DSession } from '../../components/three/Scene3DGate';
import { useReduceMotion } from '../../theme/motion';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@react-three/fiber/native', () => {
  const { View } = jest.requireActual('react-native');
  return { Canvas: () => <View testID="r3f-canvas" />, useFrame: jest.fn() };
});
jest.mock('../../theme/motion', () => ({ useReduceMotion: jest.fn(() => false) }));

const PITCH =
  'LifeNest helps adults organise documents and instructions in one secure place so that loved ones can find them when needed.';

describe('S1 Welcome (T-S1-1)', () => {
  beforeEach(() => {
    resetScene3DSession();
    jest.clearAllMocks();
    (useReduceMotion as jest.Mock).mockReturnValue(false);
  });

  it('T-S1-1 shows the 3D vault scene, the wordmark, the pitch, "Get started" and "Log in"', async () => {
    await render(<Welcome />);
    expect(screen.getByTestId('r3f-canvas')).toBeOnTheScreen();
    expect(screen.getByLabelText('Vault door')).toBeOnTheScreen();
    expect(screen.getByText('LifeNest')).toBeOnTheScreen();
    expect(screen.getByText(PITCH)).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Get started' })).toBeOnTheScreen();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeOnTheScreen();
  });

  it('T-S1-1 shows FlatVault instead when Reduce motion is on', async () => {
    (useReduceMotion as jest.Mock).mockReturnValue(true);
    await render(<Welcome />);
    expect(screen.queryByTestId('r3f-canvas')).toBeNull();
    expect(screen.getByTestId('flat-vault')).toBeOnTheScreen();
  });

  it('T-S1-1 shows no wording that is not in the PRD (Section 18 #17)', async () => {
    await render(<Welcome />);
    expect(screen.queryByText(/encrypt/i)).toBeNull();
    expect(screen.queryByText(/sanctuary/i)).toBeNull();
    expect(screen.queryByText(/already have an account/i)).toBeNull();
  });

  it('T-S1-1 "Get started" goes to S2 Sign Up', async () => {
    await render(<Welcome />);
    await fireEvent.press(screen.getByRole('button', { name: 'Get started' }));
    expect(router.push).toHaveBeenCalledWith('/sign-up');
  });

  it('T-S1-1 "Log in" goes to S3 Log In', async () => {
    await render(<Welcome />);
    await fireEvent.press(screen.getByRole('button', { name: 'Log in' }));
    expect(router.push).toHaveBeenCalledWith('/log-in');
  });
});
