import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import type { Group, Mesh } from 'three';

import { messages } from '../../lib/messages';
import { tokens } from '../../theme/tokens';
import { Canvas, useFrame } from './fiber';
import { RING_SEGMENTS, RingLabel } from './FlatRing';

const TILT_DEG = 20;
const TURN_SECONDS = 40;
const FILL_SECONDS = 0.6;
const FPS_SAMPLE_SECONDS = 2;
const SIZE = 200;

type Props = {
  done: number;
  /** False when S7 is not focused or the app is in the background: the frame loop pauses. */
  active: boolean;
  onFps?: (avgFps: number) => void;
  onPress?: () => void;
};

/** S7 readiness ring (Section 7.4): 8 torus arcs, the first `done` gold, tilted 20°, one turn per 40 s. */
export function ReadinessRingScene({ done, active, onFps }: Props) {
  return (
    <View
      testID="readiness-ring-3d"
      style={styles.wrapper}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`Readiness: ${messages.readinessCount(done)}`}
    >
      <Canvas frameloop={active ? 'always' : 'never'} camera={{ position: [0, 0, 6], fov: 40 }}>
        <color attach="background" args={[tokens.color.surface]} />
        <ambientLight intensity={0.7} color={tokens.color.three.light} />
        <directionalLight position={[3, 4, 5]} intensity={1.2} color={tokens.color.three.light} />
        <Ring done={done} onFps={onFps} />
      </Canvas>
      <RingLabel done={done} />
    </View>
  );
}

function Ring({ done, onFps }: { done: number; onFps?: (avgFps: number) => void }) {
  const group = useRef<Group>(null);
  const segments = useRef<(Mesh | null)[]>([]);
  const frames = useRef(0);
  const reported = useRef(false);
  // The newly done segments grow in over 0.6 s when `done` goes up (the S7 Success state).
  const previousDone = useRef(done);
  const fillFrom = useRef(done);
  const fill = useRef(1);

  useEffect(() => {
    if (done > previousDone.current) {
      fillFrom.current = previousDone.current;
      fill.current = 0;
    }
    previousDone.current = done;
  }, [done]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (group.current) group.current.rotation.z = -((t / TURN_SECONDS) * Math.PI * 2);
    if (fill.current < 1) {
      fill.current = Math.min(1, fill.current + delta / FILL_SECONDS);
      for (let i = fillFrom.current; i < done; i += 1) segments.current[i]?.scale.setScalar(Math.max(0.01, fill.current));
    }
    if (!reported.current) {
      frames.current += 1;
      if (t >= FPS_SAMPLE_SECONDS) {
        reported.current = true;
        onFps?.(frames.current / t);
      }
    }
  });

  const arc = (Math.PI * 2) / RING_SEGMENTS;
  const gap = 0.08;
  return (
    <group rotation={[-(TILT_DEG * Math.PI) / 180, 0, 0]}>
      <group ref={group}>
        {Array.from({ length: RING_SEGMENTS }, (_, i) => {
          const gold = i < done;
          return (
            <mesh
              key={i}
              ref={(m) => {
                segments.current[i] = m;
              }}
              rotation={[0, 0, Math.PI / 2 - (i + 1) * arc + gap / 2]}
            >
              <torusGeometry args={[1.6, 0.16, 16, 48, arc - gap]} />
              <meshStandardMaterial
                color={gold ? tokens.color.three.gold : tokens.color.placeholder}
                metalness={gold ? 0.7 : 0.1}
                roughness={0.35}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: SIZE, height: SIZE, alignSelf: 'center' },
});
