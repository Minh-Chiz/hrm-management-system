import React, { useState, useRef } from 'react';
import { View, Text, TextInput, Pressable, ViewStyle, KeyboardTypeOptions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface InputFieldProps {
  label?: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  iconName?: keyof typeof MaterialIcons.glyphMap;
  onIconPress?: () => void;
  onPress?: () => void; // If provided, renders as a clickable button instead of TextInput (e.g. for DatePicker)
  readOnly?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  className?: string;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  iconName,
  onIconPress,
  onPress,
  readOnly = false,
  secureTextEntry = false,
  keyboardType,
  className = '',
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Border and shadow styling for focus glow state
  const getContainerStyle = (): ViewStyle => {
    if (isFocused) {
      return {
        borderColor: '#00daf3',
        shadowColor: '#00daf3',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 3,
      };
    }
    if (error) {
      return {
        borderColor: '#ffb4ab',
      };
    }
    return {
      borderColor: 'rgba(59, 73, 76, 0.3)',
    };
  };

  const renderInputContent = () => {
    if (onPress) {
      // Render as pressable field (e.g. for DatePicker)
      return (
        <Pressable
          onPress={onPress}
          className="w-full h-12 bg-brand-input flex-row items-center justify-between px-4 rounded-lg active:scale-[0.99] transition-all"
          style={getContainerStyle()}
        >
          <Text className={`font-body-md ${value ? 'text-brand-on-surface' : 'text-brand-outline'}`}>
            {value || placeholder}
          </Text>
          {iconName && (
            <Pressable onPress={onIconPress || onPress}>
              <MaterialIcons name={iconName} size={20} color="#bac9cc" />
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
        className="w-full h-12 bg-brand-input flex-row items-center justify-between px-4 rounded-lg border"
        style={getContainerStyle()}
      >
        <TextInput
          ref={inputRef}
          className="flex-1 h-full text-brand-on-surface"
          style={{ height: '100%', paddingVertical: 0 }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#849396"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          editable={!readOnly}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {iconName && (
          <Pressable onPress={onIconPress} className="p-1">
            <MaterialIcons name={iconName} size={20} color="#bac9cc" />
          </Pressable>
        )}
      </Pressable>
    );
  };

  return (
    <View className={`flex-col space-y-2 w-full ${className}`}>
      {label ? (
        <Text className="font-semibold text-xs text-brand-on-surface-variant uppercase tracking-wider">
          {label}
        </Text>
      ) : null}
      
      {renderInputContent()}

      {error && (
        <Text className="text-xs text-brand-error mt-1">
          {error}
        </Text>
      )}
    </View>
  );
};
