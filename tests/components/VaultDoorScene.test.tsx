import { render, screen } from '@testing-library/react-native';

import { FlatVault } from '../../components/three/FlatVault';
import {
  VAULT_DOOR_PARTS,
  VaultDoorScene,
  resetVaultDoorIntro,
  vaultDoorPose,
} from '../../components/three/VaultDoorScene';
import { tokens } from '../../theme/tokens';

jest.mock('@react-three/fiber/native', () => {
  const { View } = jest.requireActual('react-native');
  return { Canvas: () => <View testID="r3f-canvas" />, useFrame: jest.fn() };
});

describe('VaultDoorScene and FlatVault (T-3D-3)', () => {
  beforeEach(() => resetVaultDoorIntro());

  it('T-3D-3 the scene has the accessibility label "Vault door"', async () => {
    await render(<VaultDoorScene />);
    expect(screen.getByLabelText('Vault door')).toBeOnTheScreen();
    expect(screen.getByTestId('r3f-canvas')).toBeOnTheScreen();
  });

  it('T-3D-3 the flat fallback also has the label "Vault door"', async () => {
    await render(<FlatVault />);
    expect(screen.getByLabelText('Vault door')).toBeOnTheScreen();
  });

  it('T-3D-3 uses only the Section 7.4 shapes: a cylinder door, a torus handle and bolts', async () => {
    const door = VAULT_DOOR_PARTS.filter((p) => p.part === 'door');
    const handle = VAULT_DOOR_PARTS.filter((p) => p.part === 'handle');
    const bolts = VAULT_DOOR_PARTS.filter((p) => p.part === 'bolt');
    expect(door).toHaveLength(1);
    expect(door[0].geometry).toBe('cylinder');
    expect(handle).toHaveLength(1);
    expect(handle[0].geometry).toBe('torus');
    expect(bolts.length).toBeGreaterThan(0);
    VAULT_DOOR_PARTS.forEach((p) => expect(['cylinder', 'torus']).toContain(p.geometry));
  });

  it('T-3D-3 colours come only from color.three tokens (navy door, gold handle and bolts)', async () => {
    const allowed = Object.values(tokens.color.three);
    VAULT_DOOR_PARTS.forEach((p) => expect(allowed).toContain(p.color));
    expect(VAULT_DOOR_PARTS.find((p) => p.part === 'door')?.color).toBe(tokens.color.three.navy);
    expect(VAULT_DOOR_PARTS.find((p) => p.part === 'handle')?.color).toBe(tokens.color.three.gold);
    VAULT_DOOR_PARTS.filter((p) => p.part === 'bolt').forEach((b) =>
      expect(b.color).toBe(tokens.color.three.gold),
    );
  });

  it('T-3D-3 the intro turns the handle 90° and swings the door 35° over 2.5 s', async () => {
    expect(vaultDoorPose(0, true)).toEqual({ handleDeg: 0, doorDeg: 0 });
    const end = vaultDoorPose(2.5, true);
    expect(end.handleDeg).toBeCloseTo(90);
    expect(end.doorDeg).toBeCloseTo(35);
  });

  it('T-3D-3 after the intro the door rests with a slow sway of 6° in total', async () => {
    const samples = Array.from({ length: 200 }, (_, i) => vaultDoorPose(2.5 + i * 0.1, true).doorDeg);
    expect(Math.max(...samples) - Math.min(...samples)).toBeCloseTo(6, 0);
    samples.forEach((deg) => expect(Math.abs(deg - 35)).toBeLessThanOrEqual(3.0001));
  });

  it('T-3D-3 the animation plays once per launch: the second mount starts at rest', async () => {
    const first = await render(<VaultDoorScene />);
    expect(screen.getByTestId('vault-door-intro')).toBeOnTheScreen();
    await first.unmount();

    await render(<VaultDoorScene />);
    expect(screen.getByTestId('vault-door-rest')).toBeOnTheScreen();
    expect(vaultDoorPose(0, false)).toEqual({ handleDeg: 90, doorDeg: 35 });
  });
});
