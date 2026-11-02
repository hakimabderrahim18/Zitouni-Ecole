import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacityProps,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../../theme/tokens';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'gold' | 'destructive' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  onPress,
  style,
  ...props
}) => {
  const handlePress = (e: any) => {
    if (disabled || isLoading) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {}
    }
    onPress?.(e);
  };

  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.secondary;
      case 'gold':
        return styles.gold;
      case 'destructive':
        return styles.destructive;
      case 'ghost':
        return styles.ghost;
      default:
        return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'secondary':
        return styles.textSecondary;
      case 'gold':
        return styles.textGold;
      case 'destructive':
        return styles.textDestructive;
      case 'ghost':
        return styles.textGhost;
      default:
        return styles.textPrimary;
    }
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: disabled || isLoading }}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.85}
      style={[
        styles.base,
        getVariantStyle(),
        (disabled || isLoading) && styles.disabled,
        style,
      ]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? theme.colors.brand[500] : '#FFFFFF'} />
      ) : (
        <Text style={[styles.textBase, getTextStyle()]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    height: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.md,
    minWidth: 44,
  },
  primary: {
    backgroundColor: theme.colors.brand[500], // Bordeaux Principal #7B1E3A
  },
  secondary: {
    backgroundColor: theme.colors.surface.card,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,
  },
  gold: {
    backgroundColor: theme.colors.gold[500], // Or #C9A24D
  },
  destructive: {
    backgroundColor: theme.colors.status.danger,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  textBase: {
    fontSize: 15,
    fontWeight: '700',
  },
  textPrimary: {
    color: '#FFFFFF',
  },
  textSecondary: {
    color: theme.colors.text.primary,
  },
  textGold: {
    color: '#FFFFFF',
  },
  textDestructive: {
    color: '#FFFFFF',
  },
  textGhost: {
    color: theme.colors.brand[500],
  },
});
