import { tokens } from '../../theme/tokens';

export type Scene3DSignals = {
  reduceMotion: boolean;
  glFailed: boolean;
  /** Average frames per second over the first 2 seconds; undefined until measured. */
  avgFps: number | undefined;
};

/**
 * Section 7.4: use the flat 2D version when Reduce motion is on, the GL
 * surface failed, or the first 2 seconds averaged under `three.minFps`.
 * A pure rule (no React hooks inside), named as the plan names it.
 */
export function useFlatFallback({ reduceMotion, glFailed, avgFps }: Scene3DSignals): boolean {
  if (reduceMotion || glFailed) return true;
  return avgFps !== undefined && avgFps < tokens.three.minFps;
}

/** Same rule under a non-hook name, so it can be called anywhere in components. */
export const shouldUseFlatFallback = useFlatFallback;
