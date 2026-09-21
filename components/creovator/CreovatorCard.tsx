import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { CreovatorTheme } from '@/constants/theme';
import { useResponsive } from '@/constants/useResponsive';

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
  const r = useResponsive(); // ⭐ shared responsive helper

  // Padding/radius scale gently with screen width so cards don't feel
  // cramped on small phones or oddly tiny on tablets.
  const dynamicCard = {
    borderRadius: r.size(0.055, 16, 22),
    padding: r.size(0.045, 14, 18),
  };

  const cardStyles: any[] = [styles.card, dynamicCard];

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
    marginBottom: 14,
    width: '100%', // ⭐ never overflows its parent, no matter the screen
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