import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Scene3DGate, resetScene3DSession } from '../../components/three/Scene3DGate';
import { useReduceMotion } from '../../theme/motion';

jest.mock('@react-three/fiber/native', () => {
  const { View } = jest.requireActual('react-native');
  return { Canvas: () => <View testID="r3f-canvas" />, useFrame: jest.fn() };
});
jest.mock('../../theme/motion', () => ({ useReduceMotion: jest.fn(() => false) }));

const mockedReduceMotion = useReduceMotion as jest.Mock;

type SceneCallbacks = { onGlError: () => void; onFps: (avg: number) => void };
let callbacks: SceneCallbacks;

const renderGate = () =>
  render(
    <Scene3DGate
      renderScene={(cb) => {
        callbacks = cb;
        return <Text>3D scene</Text>;
      }}
      fallback={<Text>Flat scene</Text>}
    />,
  );

describe('Scene3DGate (T-3D-2)', () => {
  beforeEach(() => {
    resetScene3DSession();
    mockedReduceMotion.mockReturnValue(false);
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  it('T-3D-2 renders the 3D child normally', async () => {
    await renderGate();
    expect(screen.getByText('3D scene')).toBeOnTheScreen();
    expect(screen.queryByText('Flat scene')).toBeNull();
  });

  it('T-3D-2 renders the flat child when Reduce motion is on', async () => {
    mockedReduceMotion.mockReturnValue(true);
    await renderGate();
    expect(screen.getByText('Flat scene')).toBeOnTheScreen();
    expect(screen.queryByText('3D scene')).toBeNull();
  });

  it('T-3D-2 renders the flat child when the canvas reports an error', async () => {
    await renderGate();
    await act(async () => {
      callbacks.onGlError();
    });
    expect(screen.getByText('Flat scene')).toBeOnTheScreen();
  });

  it('T-3D-2 renders the flat child when the scene throws while rendering', async () => {
    const Broken = () => {
      throw new Error('GL context could not be created');
    };
    await render(<Scene3DGate renderScene={() => <Broken />} fallback={<Text>Flat scene</Text>} />);
    expect(screen.getByText('Flat scene')).toBeOnTheScreen();
  });

  it('T-3D-2 renders the flat child when the first 2 seconds average under 30 fps', async () => {
    await renderGate();
    await act(async () => {
      callbacks.onFps(22);
    });
    expect(screen.getByText('Flat scene')).toBeOnTheScreen();
  });

  it('T-3D-2 keeps the 3D child when the frame rate is good', async () => {
    await renderGate();
    await act(async () => {
      callbacks.onFps(58);
    });
    expect(screen.getByText('3D scene')).toBeOnTheScreen();
  });

  it('T-3D-2 keeps the flat choice for the rest of the session', async () => {
    const first = await renderGate();
    await act(async () => {
      callbacks.onFps(12);
    });
    await first.unmount();

    await renderGate();
    expect(screen.getByText('Flat scene')).toBeOnTheScreen();
  });
});
