import { Canvas, useFrame } from './fiber';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Group } from 'three';

import { labels } from '../../lib/messages';
import { tokens } from '../../theme/tokens';

/* ------------------------------------------------------------------ */
/* Scene description (Section 7.4): built-in shapes only, token colours */
/* ------------------------------------------------------------------ */

type Part = {
  part: 'door' | 'rim' | 'hub' | 'handle' | 'bolt';
  geometry: 'cylinder' | 'torus';
  /** CylinderGeometry: [radiusTop, radiusBottom, height, segments]; TorusGeometry: [radius, tube, radialSegments, tubularSegments] */
  args: [number, number, number, number];
  position: [number, number, number];
  color: string;
};

const DOOR_RADIUS = 1.2;
const BOLT_COUNT = 8;

export const VAULT_DOOR_PARTS: readonly Part[] = [
  { part: 'door', geometry: 'cylinder', args: [DOOR_RADIUS, DOOR_RADIUS, 0.3, 64], position: [0, 0, 0], color: tokens.color.three.navy },
  { part: 'rim', geometry: 'torus', args: [DOOR_RADIUS, 0.05, 16, 96], position: [0, 0, 0.15], color: tokens.color.three.gold },
  { part: 'hub', geometry: 'cylinder', args: [0.14, 0.14, 0.12, 32], position: [0, 0, 0.21], color: tokens.color.three.gold },
  { part: 'handle', geometry: 'torus', args: [0.42, 0.05, 16, 64], position: [0, 0, 0.24], color: tokens.color.three.gold },
  ...Array.from({ length: BOLT_COUNT }, (_, i): Part => {
    const angle = (i / BOLT_COUNT) * Math.PI * 2;
    return {
      part: 'bolt',
      geometry: 'cylinder',
      args: [0.07, 0.07, 0.08, 16],
      position: [Math.cos(angle) * 0.95, Math.sin(angle) * 0.95, 0.19],
      color: tokens.color.three.gold,
    };
  }),
];

/* ------------------------------------------------------------------ */
/* Motion: handle turns 90°, door swings 35° over 2.5 s, then a 6° sway */
/* ------------------------------------------------------------------ */

const HANDLE_TURN_DEG = 90;
const DOOR_OPEN_DEG = 35;
const INTRO_SECONDS = 2.5;
const HANDLE_SECONDS = 0.8;
const SWAY_TOTAL_DEG = 6;
const SWAY_PERIOD_SECONDS = 8;

const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

export type VaultDoorPose = { handleDeg: number; doorDeg: number };

/** Pose at `t` seconds. Without the intro the door starts at rest (open, swaying). */
export function vaultDoorPose(t: number, playIntro: boolean): VaultDoorPose {
  const restTime = playIntro ? t - INTRO_SECONDS : t;
  if (restTime >= 0) {
    const sway = (SWAY_TOTAL_DEG / 2) * Math.sin((2 * Math.PI * restTime) / SWAY_PERIOD_SECONDS);
    return { handleDeg: HANDLE_TURN_DEG, doorDeg: DOOR_OPEN_DEG + sway };
  }
  const handleDeg = HANDLE_TURN_DEG * easeInOut(clamp01(t / HANDLE_SECONDS));
  const doorDeg = DOOR_OPEN_DEG * easeInOut(clamp01((t - HANDLE_SECONDS) / (INTRO_SECONDS - HANDLE_SECONDS)));
  return { handleDeg, doorDeg };
}

/** The opening plays once per app launch; later mounts start at rest. */
let introPlayed = false;

/** Test helper: pretend the app was just launched. */
export function resetVaultDoorIntro() {
  introPlayed = false;
}

/* ------------------------------------------------------------------ */
/* Components                                                          */
/* ------------------------------------------------------------------ */

type Props = {
  onFps?: (avgFps: number) => void;
};

/** S1 vault door (Section 7.4). Wrapped by Scene3DGate, which handles GL errors. */
export function VaultDoorScene({ onFps }: Props) {
  const [playIntro] = useState(() => !introPlayed);

  useEffect(() => {
    introPlayed = true;
  }, []);

  return (
    <View
      testID={playIntro ? 'vault-door-intro' : 'vault-door-rest'}
      style={styles.wrapper}
      accessible
      accessibilityRole="image"
      accessibilityLabel={labels.vaultDoor}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 40 }}>
        <color attach="background" args={[tokens.color.background]} />
        <ambientLight intensity={0.6} color={tokens.color.three.light} />
        <directionalLight position={[3, 4, 5]} intensity={1.4} color={tokens.color.three.light} />
        <Door playIntro={playIntro} onFps={onFps} />
      </Canvas>
    </View>
  );
}

const FPS_SAMPLE_SECONDS = 2;
const toRad = (deg: number) => (deg * Math.PI) / 180;

function Door({ playIntro, onFps }: { playIntro: boolean; onFps?: (avgFps: number) => void }) {
  const hinge = useRef<Group>(null);
  const handle = useRef<Group>(null);
  const frames = useRef(0);
  const reported = useRef(false);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pose = vaultDoorPose(t, playIntro);
    if (hinge.current) hinge.current.rotation.y = -toRad(pose.doorDeg);
    if (handle.current) handle.current.rotation.z = -toRad(pose.handleDeg);

    if (!reported.current) {
      frames.current += 1;
      if (t >= FPS_SAMPLE_SECONDS) {
        reported.current = true;
        onFps?.(frames.current / t);
      }
    }
  });

  const handleParts = VAULT_DOOR_PARTS.filter((p) => p.part === 'handle' || p.part === 'hub');
  const bodyParts = VAULT_DOOR_PARTS.filter((p) => p.part !== 'handle' && p.part !== 'hub');

  return (
    // Hinge on the left edge of the door, so the door swings open towards the viewer.
    <group ref={hinge} position={[-DOOR_RADIUS, 0, 0]} rotation={[0.12, 0.3, 0]}>
      <group position={[DOOR_RADIUS, 0, 0]}>
        {bodyParts.map((p, i) => (
          <PartMesh key={`${p.part}-${i}`} part={p} />
        ))}
        <group ref={handle}>
          {handleParts.map((p) => (
            <PartMesh key={p.part} part={p} />
          ))}
        </group>
      </group>
    </group>
  );
}

function PartMesh({ part }: { part: Part }) {
  // Cylinders stand on the Y axis in Three.js; turn them to face the camera.
  const rotation: [number, number, number] = part.geometry === 'cylinder' ? [Math.PI / 2, 0, 0] : [0, 0, 0];
  return (
    <mesh position={part.position} rotation={rotation}>
      {part.geometry === 'cylinder' ? (
        <cylinderGeometry args={part.args} />
      ) : (
        <torusGeometry args={part.args} />
      )}
      <meshStandardMaterial
        color={part.color}
        metalness={part.color === tokens.color.three.gold ? 0.8 : 0.3}
        roughness={0.35}
      />
    </mesh>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
});
