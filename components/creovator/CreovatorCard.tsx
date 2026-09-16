import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { CreovatorTheme } from '@/constants/theme';

interface CreovatorCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  glow?: 'none' | 'primary' | 'secondary';
}

export const CreovatorCard: React.FC<CreovatorCardProps> = ({
  children,
  style,
  onPress,
  glow = 'none',
}) => {
  const cardStyles: any[] = [styles.card];

  if (glow === 'primary') {
    cardStyles.push(styles.glowPrimary);
  } else if (glow === 'secondary') {
    cardStyles.push(styles.glowSecondary);
  }

  if (style) cardStyles.push(style);

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: CreovatorTheme.colors.bgCard,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.cardBorder,
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
  },
  glowPrimary: {
    borderColor: CreovatorTheme.colors.primaryGlow,
    shadowColor: CreovatorTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  glowSecondary: {
    borderColor: CreovatorTheme.colors.secondaryGlow,
    shadowColor: CreovatorTheme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
});
