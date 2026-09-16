import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CreovatorTheme } from '@/constants/theme';

interface CreovatorInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  isPassword?: boolean;
  containerStyle?: ViewStyle;
}

export const CreovatorInput: React.FC<CreovatorInputProps> = ({
  label,
  error,
  leftIcon,
  isPassword = false,
  containerStyle,
  style,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={CreovatorTheme.colors.textDim}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={CreovatorTheme.colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: CreovatorTheme.colors.textLight,
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CreovatorTheme.colors.inputBg,
    borderWidth: 1,
    borderColor: CreovatorTheme.colors.inputBorder,
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  inputFocused: {
    borderColor: CreovatorTheme.colors.primary,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  inputError: {
    borderColor: CreovatorTheme.colors.destructive,
  },
  leftIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: CreovatorTheme.colors.textWhite,
    fontSize: 15,
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 6,
  },
  errorText: {
    fontSize: 12,
    color: CreovatorTheme.colors.destructive,
    marginTop: 4,
    marginLeft: 4,
  },
});
