import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TextInputProps,
  StyleSheet,
} from 'react-native';
import { theme } from '../../theme/tokens';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, style, ...props }, ref) => {
    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          placeholderTextColor={theme.colors.text.subtle}
          style={[
            styles.input,
            error ? styles.inputError : null,
            style,
          ]}
          {...props}
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xs,
    textAlign: 'right',
  },
  input: {
    height: 48,
    backgroundColor: theme.colors.surface.input, // #FAF4EB
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.surface.border,   // #DFD3C2
    paddingHorizontal: theme.spacing.md,
    color: theme.colors.text.primary,           // #2B2022
    fontSize: 15,
    textAlign: 'right',
  },
  inputError: {
    borderColor: theme.colors.status.danger,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.status.danger,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
    fontWeight: '600',
  },
});
