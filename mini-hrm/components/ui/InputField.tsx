import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ViewStyle, TextInputProps } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface InputFieldProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onIconPress?: () => void;
  onPress?: () => void; // If provided, renders as pressable field (e.g. for DatePicker)
  readOnly?: boolean;
  secureTextEntry?: boolean;
  className?: string;
  error?: string;
  helperText?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value = '',
  onChangeText,
  placeholder,
  iconName,
  leftIcon: customLeftIcon,
  rightIcon: customRightIcon,
  onIconPress,
  onPress,
  readOnly = false,
  secureTextEntry = false,
  className = '',
  error,
  helperText,
  style,
  ...restInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Determine left vs right icon placement automatically
  const effectiveLeftIcon = customLeftIcon || (!onIconPress && !customRightIcon ? iconName : undefined);
  const effectiveRightIcon = customRightIcon || (onIconPress ? iconName : undefined);

  // Border and shadow styling for focus glow state
  const getContainerStyle = (): ViewStyle => {
    if (isFocused) {
      return {
        borderColor: '#00e5ff',
        shadowColor: '#00e5ff',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 3,
      };
    }
    if (error) {
      return {
        borderColor: '#ff4d4f',
      };
    }
    return {
      borderColor: 'rgba(59, 73, 76, 0.45)',
    };
  };

  const renderInputContent = () => {
    if (onPress) {
      // Render as pressable field (e.g. for DatePicker/Modal)
      return (
        <Pressable
          onPress={onPress}
          className="w-full bg-brand-input flex-row items-center px-3.5 rounded-xl border active:scale-[0.99] transition-all"
          style={[
            {
              height: 50,
              flexDirection: 'row',
              alignItems: 'center',
            },
            getContainerStyle(),
          ]}
        >
          {effectiveLeftIcon && (
            <View style={{ width: 24, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <MaterialIcons
                name={effectiveLeftIcon}
                size={20}
                color={isFocused ? '#00e5ff' : '#849396'}
              />
            </View>
          )}
          <Text 
            className={`flex-1 text-sm font-medium ${value ? 'text-brand-on-surface' : 'text-brand-outline'}`}
            style={{ 
              includeFontPadding: false,
              textAlignVertical: 'center',
            }}
          >
            {value || placeholder}
          </Text>
          {effectiveRightIcon && (
            <Pressable 
              onPress={onIconPress || onPress} 
              style={{ width: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }}
            >
              <MaterialIcons
                name={effectiveRightIcon}
                size={20}
                color={isFocused ? '#00e5ff' : '#849396'}
              />
            </Pressable>
          )}
        </Pressable>
      );
    }

    return (
      <Pressable 
        onPress={() => {
          if (!readOnly) {
            inputRef.current?.focus();
          }
        }}
        className="w-full bg-brand-input flex-row items-center px-3.5 rounded-xl border"
        style={[
          {
            height: 50,
            flexDirection: 'row',
            alignItems: 'center',
          },
          getContainerStyle(),
        ]}
      >
        {effectiveLeftIcon && (
          <View style={{ width: 24, alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <MaterialIcons
              name={effectiveLeftIcon}
              size={20}
              color={isFocused ? '#00e5ff' : '#849396'}
            />
          </View>
        )}

        <TextInput
          ref={inputRef}
          className="flex-1 text-brand-on-surface text-sm font-medium"
          style={[
            {
              flex: 1,
              height: '100%',
              paddingVertical: 0,
              paddingHorizontal: 0,
              paddingTop: 0,
              paddingBottom: 0,
              margin: 0,
              textAlignVertical: 'center',
              includeFontPadding: false,
            },
            style,
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={restInputProps.placeholderTextColor || '#849396'}
          secureTextEntry={secureTextEntry}
          editable={!readOnly}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={(e) => {
            setIsFocused(true);
            restInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            restInputProps.onBlur?.(e);
          }}
          {...restInputProps}
        />

        {effectiveRightIcon && (
          <Pressable 
            onPress={onIconPress} 
            style={{ width: 24, alignItems: 'center', justifyContent: 'center', marginLeft: 8 }} 
            hitSlop={6}
          >
            <MaterialIcons
              name={effectiveRightIcon}
              size={20}
              color={isFocused ? '#00e5ff' : '#849396'}
            />
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View className={`flex-col w-full ${className}`}>
      {label ? (
        <Text className="font-semibold text-xs text-brand-on-surface-variant uppercase tracking-wider mb-1.5">
          {label}
        </Text>
      ) : null}

      {renderInputContent()}

      {error ? (
        <Text className="text-xs text-brand-error mt-1 font-medium">
          {error}
        </Text>
      ) : helperText ? (
        <Text className="text-xs text-brand-outline mt-1">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
};

export default InputField;
