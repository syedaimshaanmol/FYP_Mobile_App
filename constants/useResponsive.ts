import { useWindowDimensions } from 'react-native';

/**
 * Clamp a value between a min and max — keeps sizes from getting
 * too tiny on small phones or too huge on tablets/web.
 */
export const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

/**
 * useResponsive()
 * Drop this into any screen instead of re-deriving the same
 * breakpoint/scale logic every time.
 *
 * Usage:
 *   const r = useResponsive();;
 *   <Text style={{ fontSize: r.font(0.06, 20, 28) }}>Hello</Text>
 *   <View style={{ padding: r.pad, maxWidth: r.maxWidth, alignSelf: 'center', width: '100%' }}>
 */
export function useResponsive() {
  const { width, height } = useWindowDimensions();

  const isSmallScreen = width < 360;
  const isTablet = width >= 700;

  return {
    width,
    height,
    isSmallScreen,
    isTablet,
    // horizontal screen padding, scales with width, capped both ends
    pad: clamp(width * 0.04, 12, 24),
    // caps content width on tablets/web so things don't stretch edge-to-edge
    maxWidth: isTablet ? 640 : undefined,
    // helper for "font size = % of screen width, clamped"
    font: (pct: number, min: number, max: number) => clamp(width * pct, min, max),
    // helper for any size (icons, circles, etc.)
    size: (pct: number, min: number, max: number) => clamp(width * pct, min, max),
  };
}