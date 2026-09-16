import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CreovatorTheme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CreovatorHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  onBackPress?: () => void;
  rightAction?: React.ReactNode;
  rightIcon?: string;
  onRightPress?: () => void;
  showLogo?: boolean;
}

export const CreovatorHeader: React.FC<CreovatorHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  onBackPress,
  rightAction,
  rightIcon,
  onRightPress,
  showLogo = false,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color={CreovatorTheme.colors.textWhite} />
            </TouchableOpacity>
          )}

          {showLogo ? (
            <Image
              source={require('@/assets/images/creovator-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          ) : (
            <View>
              {title && <Text style={styles.title} numberOfLines={1}>{title}</Text>}
              {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
            </View>
          )}
        </View>

        {rightAction ? (
          <View style={styles.rightSection}>{rightAction}</View>
        ) : rightIcon ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onRightPress}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={rightIcon as any} size={22} color={CreovatorTheme.colors.textWhite} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: CreovatorTheme.colors.bgDark,
    borderBottomWidth: 1,
    borderBottomColor: CreovatorTheme.colors.cardBorder,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logo: {
    width: 140,
    height: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: CreovatorTheme.colors.textWhite,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    color: CreovatorTheme.colors.textMuted,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
});
