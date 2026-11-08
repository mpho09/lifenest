import { useFlatFallback } from '../../lib/rules/scene3d';

describe('3D fallback rule (Section 7.4)', () => {
  it('T-3D-1 is true when Reduce motion is on', () => {
    expect(useFlatFallback({ reduceMotion: true, glFailed: false, avgFps: 60 })).toBe(true);
  });

  it('T-3D-1 is true when the GL surface failed', () => {
    expect(useFlatFallback({ reduceMotion: false, glFailed: true, avgFps: 60 })).toBe(true);
  });

  it('T-3D-1 is true when the average fps is below 30', () => {
    expect(useFlatFallback({ reduceMotion: false, glFailed: false, avgFps: 29.9 })).toBe(true);
  });

  it('T-3D-1 is false when all is well (30 fps exactly is enough)', () => {
    expect(useFlatFallback({ reduceMotion: false, glFailed: false, avgFps: 30 })).toBe(false);
    expect(useFlatFallback({ reduceMotion: false, glFailed: false, avgFps: 60 })).toBe(false);
  });

  it('T-3D-1 is false while the fps is not measured yet', () => {
    expect(useFlatFallback({ reduceMotion: false, glFailed: false, avgFps: undefined })).toBe(false);
  });
});
