import { tokens } from '../../theme/tokens';

describe('design tokens (Section 7.1)', () => {
  it('T-SETUP-1 colours match Section 7.1 exactly', () => {
    expect(tokens.color).toEqual({
      primary: '#1F3A4D',
      accent: '#B08A4A',
      background: '#FAF8F4',
      surface: '#FFFFFF',
      text: '#1E2329',
      textSecondary: '#5A6670',
      divider: '#E5E1D8',
      error: '#B3261E',
      success: '#2E7D32',
      warning: '#8A5A00',
      chip: {
        accepted: '#1F3A4D',
        invited: '#6B7280',
        requestOpen: '#B08A4A',
        released: '#2E7D32',
        rejected: '#B3261E',
      },
      toastBackground: '#1E2329',
      placeholder: '#E9E5DC',
      badge: '#B08A4A',
      three: { navy: '#1F3A4D', gold: '#B08A4A', light: '#FFF6E5' },
    });
  });

  it('T-SETUP-1 fonts match Section 7.1 (Lora 600 headings, Inter 400/600)', () => {
    expect(tokens.font).toEqual({
      heading: 'Lora_600SemiBold',
      family: { regular: 'Inter_400Regular', semibold: 'Inter_600SemiBold' },
      title: { fontFamily: 'Lora_600SemiBold', fontSize: 24 },
      section: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
      body: { fontFamily: 'Inter_400Regular', fontSize: 16 },
      button: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
      small: { fontFamily: 'Inter_400Regular', fontSize: 14 },
    });
  });

  it('T-SETUP-1 spacing, radius, shadow, sizes and 3D values match Section 7.1', () => {
    expect(tokens.space).toEqual({ 1: 4, 2: 8, 4: 16, 6: 24, screen: 16 });
    expect(tokens.radius).toEqual({ card: 12, button: 10, input: 8, circle: 9999 });
    expect(tokens.shadow.card).toBe('0px 1px 3px rgba(0, 0, 0, 0.08)');
    expect(tokens.size).toEqual({ button: 48, touchMin: 48 });
    expect(tokens.three).toEqual({ minFps: 30 });
  });
});
