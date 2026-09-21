import { CreovatorTheme } from '@/constants/theme';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useResponsive } from '@/constants/useResponsive';
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginSelection() {
  const router = useRouter();
  const r = useResponsive();;
  const insets = useSafeAreaInsets();

  // ⭐ Reactive dimensions — updates on rotation / web resize (unlike Dimensions.get)
  const { width: SCREEN_W, height: SCREEN_H } = useWindowDimensions();

  // Clamp helper so nothing gets too tiny (small phones) or too huge (tablets/web)
  const clamp = (val: number, min: number, max: number) =>
    Math.min(Math.max(val, min), max);

  // Everything below is derived from current screen width instead of hardcoded px
  const isSmallScreen = SCREEN_W < 360;
  const contentMaxWidth = 440; // keeps things from stretching too wide on tablets/web
  const logoAreaSize = clamp(SCREEN_W * 0.38, 120, 170);
  const logoSize = logoAreaSize * 0.75;
  const appNameSize = clamp(SCREEN_W * 0.09, 26, 36);
  const taglineSize = clamp(SCREEN_W * 0.034, 12, 14);

  // Spin animation
  const spinValue = useRef(new Animated.Value(0)).current;
  // Pulse/scale animation
  const pulseValue = useRef(new Animated.Value(1)).current;
  // Fade in animation
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous slow rotation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Gentle pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.06,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fade in on mount
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 900,
      useNativeDriver: true,
    }).start();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: isSmallScreen ? 18 : 28,
        },
      ]}
    >
      {/* Background glow blobs */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.glowCenter} />

      <Animated.View
        style={[
          styles.contentWrap,
          { opacity: fadeValue, maxWidth: contentMaxWidth },
        ]}
      >
        {/* Animated logo area */}
        <View
          style={[
            styles.logoArea,
            { width: logoAreaSize, height: logoAreaSize, marginBottom: SCREEN_H * 0.035 },
          ]}
        >
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: logoAreaSize,
                height: logoAreaSize,
                borderRadius: logoAreaSize / 2,
                transform: [{ scale: pulseValue }],
              },
            ]}
          />
          {/* Logo with spin */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Image
              source={require('@/assets/images/creovator-logo.png')}
              style={{ width: logoSize, height: logoSize }}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* App name & tagline */}
        <Text
          style={[styles.appName, { fontSize: appNameSize }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          Creovator
        </Text>
        <Text style={[styles.tagline, { fontSize: taglineSize }]}>
          Smart Event Organization &amp; Automation
        </Text>

        {/* Divider */}
        <View style={[styles.divider, { width: '55%' }]} />

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => router.push('/user-login')}
            activeOpacity={0.85}
          >
            <Text style={styles.signInText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push({ pathname: '/user-login', params: { mode: 'signup' } })}
            activeOpacity={0.85}
          >
            <Text style={styles.createText}>Create New Account</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Footer */}
      <Text style={styles.footer}>Creovator Platform © 2026</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: CreovatorTheme.colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  glowCenter: {
    position: 'absolute',
    top: '35%',
    left: '15%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(249, 187, 30, 0.06)',
  },
  contentWrap: {
    width: '100%',
    alignItems: 'center',
    alignSelf: 'center',
  },
  logoArea: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.07)',
  },
  appName: {
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
    flexShrink: 1,
    maxWidth: '100%',
  },
  tagline: {
    color: CreovatorTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
    marginBottom: 30,
    flexShrink: 1,
    maxWidth: '100%',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 30,
  },
  buttonsContainer: {
    width: '100%',
    gap: 14,
  },
  signInBtn: {
    width: '100%',
    backgroundColor: CreovatorTheme.colors.primary,
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    shadowColor: CreovatorTheme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
  },
  signInText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  createBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    paddingVertical: 15,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  createText: {
    color: CreovatorTheme.colors.primary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    color: CreovatorTheme.colors.textDim,
    fontSize: 11,
    fontWeight: '500',
  },
});