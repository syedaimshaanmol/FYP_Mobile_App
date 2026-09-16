import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { CreovatorTheme } from '@/constants/theme';

interface CreovatorButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const CreovatorButton: React.FC<CreovatorButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
}) => {
  const getContainerStyle = () => {
    const baseStyle: ViewStyle[] = [styles.button];

    // Size
    if (size === 'sm') baseStyle.push(styles.sizeSm);
    else if (size === 'lg') baseStyle.push(styles.sizeLg);
    else baseStyle.push(styles.sizeMd);

    // Variant
    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.secondary);
        break;
      case 'outline':
        baseStyle.push(styles.outline);
        break;
      case 'destructive':
        baseStyle.push(styles.destructive);
        break;
      case 'ghost':
        baseStyle.push(styles.ghost);
        break;
      default:
        baseStyle.push(styles.primary);
        break;
    }

    if (disabled || loading) baseStyle.push(styles.disabled);
    if (style) baseStyle.push(style);

    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle: TextStyle[] = [styles.text];

    if (size === 'sm') baseStyle.push(styles.textSm);
    else if (size === 'lg') baseStyle.push(styles.textLg);
    else baseStyle.push(styles.textMd);

    switch (variant) {
      case 'secondary':
        baseStyle.push(styles.textSecondary);
        break;
      case 'outline':
      case 'ghost':
        baseStyle.push(styles.textOutline);
        break;
      default:
        baseStyle.push(styles.textWhite);
        break;
    }

    if (textStyle) baseStyle.push(textStyle);
    return baseStyle;
  };

  return (
    <TouchableOpacity
      style={getContainerStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' ? '#1e1b4b' : '#ffffff'}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text style={getTextStyle()}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    gap: 8,
  },
  sizeSm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  sizeMd: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  sizeLg: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  primary: {
    backgroundColor: CreovatorTheme.colors.primary,
    shadowColor: CreovatorTheme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  secondary: {
    backgroundColor: CreovatorTheme.colors.secondary,
    shadowColor: CreovatorTheme.colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: CreovatorTheme.colors.cardBorder,
  },
  destructive: {
    backgroundColor: CreovatorTheme.colors.destructive,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  textSm: {
    fontSize: 12,
  },
  textMd: {
    fontSize: 15,
  },
  textLg: {
    fontSize: 17,
  },
  textWhite: {
    color: '#ffffff',
  },
  textSecondary: {
    color: '#0f0a1f',
    fontWeight: '800',
  },
  textOutline: {
    color: CreovatorTheme.colors.textWhite,
  },
});
