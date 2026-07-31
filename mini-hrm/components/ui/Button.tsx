import React from 'react';
import { Pressable, View, ActivityIndicator, PressableProps, StyleProp, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  title?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'dashed' | 'text' | 'danger';
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  iconName,
  iconPosition = 'left',
  className = '',
  disabled = false,
  loading = false,
  size = 'md',
  style,
  children,
  ...rest
}) => {
  // Base classes for alignment and feedback
  const baseStyle = "flex-row items-center justify-center rounded-xl active:scale-95 transition-all";
  
  // Size specific padding and text size
  let sizeStyle = "";
  let textVariantStyle = "";
  let iconSize = 20;

  switch (size) {
    case 'sm':
      sizeStyle = "px-3 py-2 h-9";
      textVariantStyle = "text-xs";
      iconSize = 16;
      break;
    case 'lg':
      sizeStyle = "px-6 py-4 h-14";
      textVariantStyle = "text-base";
      iconSize = 24;
      break;
    case 'md':
    default:
      sizeStyle = "px-4 py-3 h-12";
      textVariantStyle = "text-sm";
      iconSize = 20;
      break;
  }

  // Variant specific styling
  let variantStyle = "";
  let variantTextStyle = "";

  switch (variant) {
    case 'secondary':
      variantStyle = "bg-transparent border border-brand-neon";
      variantTextStyle = "text-brand-neon";
      break;
    case 'dashed':
      variantStyle = "bg-transparent border border-dashed border-brand-neon-dim/50 rounded-full w-10 h-10 p-0 items-center justify-center";
      variantTextStyle = "text-brand-neon-dim";
      break;
    case 'text':
      variantStyle = "bg-transparent";
      variantTextStyle = "text-brand-on-surface-variant active:text-brand-neon";
      break;
    case 'danger':
      variantStyle = "bg-red-600/20 border border-red-500/40";
      variantTextStyle = "text-red-400";
      break;
    case 'primary':
    default:
      variantStyle = "bg-brand-neon shadow-[0_0_20px_rgba(0,218,243,0.3)]";
      variantTextStyle = "text-[#000000]";
      break;
  }

  // Handle disabled styling
  if (disabled) {
    variantStyle = variant === 'dashed' 
      ? "bg-transparent border border-dashed border-brand-outline/30" 
      : "bg-brand-outline/20 border-transparent";
    variantTextStyle = "text-brand-outline";
  }

  const spinnerColor = variant === 'primary' ? '#000000' : (variant === 'danger' ? '#ff4d4f' : '#00e5ff');

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      style={({ pressed }) => [
        pressed && { transform: [{ scale: 0.95 }] },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={spinnerColor} 
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {iconName && iconPosition === 'left' && (
            <MaterialIcons 
              name={iconName} 
              size={iconSize} 
              color={disabled ? '#849396' : (variant === 'primary' ? '#000000' : (variant === 'danger' ? '#ff4d4f' : '#00e5ff'))} 
              style={{ marginRight: (title || children) ? 8 : 0 }}
            />
          )}
          
          {title ? (
            <ThemedText className={`font-semibold ${textVariantStyle} ${variantTextStyle} text-center`}>
              {title}
            </ThemedText>
          ) : children ? (
            children
          ) : null}

          {iconName && iconPosition === 'right' && (
            <MaterialIcons 
              name={iconName} 
              size={iconSize} 
              color={disabled ? '#849396' : (variant === 'primary' ? '#000000' : (variant === 'danger' ? '#ff4d4f' : '#00e5ff'))} 
              style={{ marginLeft: (title || children) ? 8 : 0 }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};

export default Button;
