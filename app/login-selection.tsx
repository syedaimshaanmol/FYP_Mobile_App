import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions,
} from 'react-native';
import { CreovatorTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_W } = Dimensions.get('window');

export default function LoginSelection() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 24 }]}>
      {/* Background glow blobs */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />
      <View style={styles.glowCenter} />

      <Animated.View style={[styles.contentWrap, { opacity: fadeValue }]}>
        {/* Animated logo area */}
        <View style={styles.logoArea}>
          {/* Outer glow ring */}
          <Animated.View
            style={[
              styles.glowRing,
              { transform: [{ scale: pulseValue }] },
            ]}
          />
          {/* Logo with spin */}
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Image
              source={require('@/assets/images/creovator-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* App name & tagline */}
        <Text style={styles.appName}>Creovator</Text>
        <Text style={styles.tagline}>
          Smart Event Organization &amp; Automation
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

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
    backgroundColor: CreovatorTheme.colors.bgDark,
    paddingHorizontal: 28,
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
  },
  logoArea: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.07)',
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: CreovatorTheme.colors.textWhite,
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: CreovatorTheme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
    marginBottom: 36,
  },
  divider: {
    width: SCREEN_W * 0.55,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: 36,
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
