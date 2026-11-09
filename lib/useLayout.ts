import { useWindowDimensions } from 'react-native';

import { tokens } from '../theme/tokens';

/** True on screens wide enough for the web layout: sidebar, wide content, grids (Section 18 #34). */
export function useIsWide(): boolean {
  const { width } = useWindowDimensions();
  return width >= tokens.layout.wideBreakpoint;
}
