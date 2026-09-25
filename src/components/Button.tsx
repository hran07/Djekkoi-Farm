import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';

export type ButtonVariant = 'default' | 'pri' | 'red' | 'ghost';
export type ButtonSize = 'md' | 'sm';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  wide?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  wide = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const theme = useTheme();

  const getContainerStyle = (): ViewStyle => {
    let bg: string = theme.surface;
    let border: string = theme.line;

    if (variant === 'pri') {
      bg = theme.accent;
      border = theme.accent;
    } else if (variant === 'red') {
      bg = theme.red;
      border = theme.red;
    } else if (variant === 'ghost') {
      bg = 'transparent';
      border = 'transparent';
    }

    const height = size === 'sm' ? 36 : 44;
    const borderRadius = size === 'sm' ? 10 : 12;
    const paddingHorizontal = size === 'sm' ? 12 : 16;

    return {
      backgroundColor: bg,
      borderColor: border,
      borderWidth: variant === 'ghost' ? 0 : 1,
      borderRadius,
      minHeight: height,
      paddingHorizontal,
      paddingVertical: size === 'sm' ? 6 : 10,
      width: wide ? '100%' : undefined,
      alignSelf: wide ? 'stretch' : 'flex-start',
      opacity: disabled ? 0.6 : 1,
    };
  };

  const getTextColor = (): string => {
    if (variant === 'pri') return theme.onAccent;
    if (variant === 'red') return '#ffffff';
    if (variant === 'ghost') return theme.ink;
    return theme.ink;
  };

  const isStringChild = typeof children === 'string';

  return (
    <TouchableOpacity
      style={[styles.btn, getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || (isStringChild ? (children as string) : undefined)
      }
    >
      {isStringChild ? (
        <Text
          style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: size === 'sm' ? 13.5 : 14.5,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  text: {
    fontFamily: FontNames.sansBold,
    textAlign: 'center',
  },
});
