import React from 'react';
import { Pressable, Text, View, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'dashed' | 'text';
  iconName?: keyof typeof MaterialIcons.glyphMap;
  iconPosition?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
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
}) => {
  // Base classes for alignment and transition feedback
  const baseStyle = "flex-row items-center justify-center rounded-xl active:scale-95 transition-all";
  
  // Size specific padding and text size
  let sizeStyle = "";
  let textStyle = "font-semibold";
  let iconSize = 20;

  switch (size) {
    case 'sm':
      sizeStyle = "px-3 py-2 h-9";
      textStyle += " text-xs";
      iconSize = 16;
      break;
    case 'lg':
      sizeStyle = "px-6 py-4 h-14";
      textStyle += " text-base";
      iconSize = 24;
      break;
    case 'md':
    default:
      sizeStyle = "px-4 py-3 h-12";
      textStyle += " text-sm";
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
      // Dashed style for things like "Add Member" button
      variantStyle = "bg-transparent border border-dashed border-brand-neon-dim/50 rounded-full w-10 h-10 p-0 items-center justify-center";
      variantTextStyle = "text-brand-neon-dim";
      break;
    case 'text':
      variantStyle = "bg-transparent";
      variantTextStyle = "text-brand-on-surface-variant active:text-brand-neon";
      break;
    case 'primary':
    default:
      // Solid neon styling with black text for peak contrast
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

  return (
    <Pressable
      onPress={disabled || loading ? undefined : onPress}
      disabled={disabled || loading}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      style={({ pressed }) => pressed && { transform: [{ scale: 0.95 }] }}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' ? '#000000' : '#00e5ff'} 
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {iconName && iconPosition === 'left' && (
            <MaterialIcons 
              name={iconName} 
              size={iconSize} 
              color={disabled ? '#849396' : (variant === 'primary' ? '#000000' : '#00e5ff')} 
              style={{ marginRight: title ? 8 : 0 }}
            />
          )}
          
          {title && (
            <Text className={`${textStyle} ${variantTextStyle} text-center`}>
              {title}
            </Text>
          )}

          {iconName && iconPosition === 'right' && (
            <MaterialIcons 
              name={iconName} 
              size={iconSize} 
              color={disabled ? '#849396' : (variant === 'primary' ? '#000000' : '#00e5ff')} 
              style={{ marginLeft: title ? 8 : 0 }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
};
