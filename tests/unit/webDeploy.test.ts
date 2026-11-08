import app from '../../app.json';
import vercel from '../../vercel.json';

describe('web preview build for Vercel (Section 18 #28)', () => {
  it('T-WEB-1 the app exports as a single-page web app with Metro', () => {
    expect(app.expo.web).toMatchObject({ bundler: 'metro', output: 'single' });
  });

  it('T-WEB-1 Vercel builds the Expo web export and serves the dist folder', () => {
    expect(vercel.buildCommand).toBe('npx expo export --platform web');
    expect(vercel.outputDirectory).toBe('dist');
  });

  it('T-WEB-1 every route falls back to index.html so deep links like /welcome load', () => {
    expect(vercel.rewrites).toEqual([{ source: '/(.*)', destination: '/index.html' }]);
  });
});
