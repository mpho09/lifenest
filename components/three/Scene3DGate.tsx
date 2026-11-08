import { Component, useCallback, useMemo, useState, type ReactNode } from 'react';

import { shouldUseFlatFallback } from '../../lib/rules/scene3d';
import { useReduceMotion } from '../../theme/motion';

export type SceneCallbacks = {
  /** Call when the GL surface fails to create. */
  onGlError: () => void;
  /** Call once with the average frames per second over the first 2 seconds. */
  onFps: (avgFps: number) => void;
};

type Props = {
  renderScene: (callbacks: SceneCallbacks) => ReactNode;
  fallback: ReactNode;
};

/**
 * Once a phone has shown it cannot run 3D well (GL failed or too slow), the
 * flat version is used for the rest of the app session (Section 7.4 rule 3).
 */
let flatForSession = false;

/** Test helper: forget the session decision. */
export function resetScene3DSession() {
  flatForSession = false;
}

/** Shows the 3D scene, or the flat fallback (Section 7.2, T-3D-1, T-3D-2). */
export function Scene3DGate({ renderScene, fallback }: Props) {
  const reduceMotion = useReduceMotion();
  const [glFailed, setGlFailed] = useState(flatForSession);
  const [avgFps, setAvgFps] = useState<number | undefined>(undefined);

  const onGlError = useCallback(() => {
    flatForSession = true;
    setGlFailed(true);
  }, []);

  const onFps = useCallback((fps: number) => {
    if (shouldUseFlatFallback({ reduceMotion: false, glFailed: false, avgFps: fps })) {
      flatForSession = true;
    }
    setAvgFps(fps);
  }, []);

  const callbacks = useMemo(() => ({ onGlError, onFps }), [onGlError, onFps]);

  if (flatForSession || shouldUseFlatFallback({ reduceMotion, glFailed, avgFps })) {
    return <>{fallback}</>;
  }

  return <SceneErrorBoundary onError={onGlError}>{renderScene(callbacks)}</SceneErrorBoundary>;
}

class SceneErrorBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
