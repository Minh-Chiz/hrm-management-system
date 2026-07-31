import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface LoginInputFieldProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  leftIcon?: keyof typeof MaterialIcons.glyphMap;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export const LoginInputField: React.FC<LoginInputFieldProps> = React.memo(({
  label,
  icon,
  leftIcon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  rightIcon,
  onRightIconPress,
  error,
  containerStyle,
  style,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  // Supplying icon or leftIcon consistently
  const activeLeftIcon = icon || leftIcon;
  const ICON_SIZE = 20;

  return (
    <View style={[styles.fieldWrapper, containerStyle]}>
      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Input Container */}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          !!error && styles.inputContainerError,
        ]}
      >
        {/* Left Icon - Căn giữa tự động nhờ alignItems: 'center' ở container */}
        {activeLeftIcon && (
          <View style={styles.leftIconWrapper}>
            <MaterialIcons
              name={activeLeftIcon}
              size={ICON_SIZE}
              color={isFocused ? '#00e5ff' : '#849396'}
            />
          </View>
        )}

        {/* TextInput */}
        <TextInput
          style={[styles.input, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#849396"
          secureTextEntry={secureTextEntry}
          autoCapitalize="none"
          autoCorrect={false}
          textAlignVertical="center"
          onFocus={(e) => {
            setIsFocused(true);
            restProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            restProps.onBlur?.(e);
          }}
          {...restProps}
        />

        {/* Right Icon - Nút ẩn/hiện mật khẩu hoặc icon bên phải (cùng size 20, cùng icon set) */}
        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.rightIconWrapper}
          >
            <MaterialIcons
              name={rightIcon}
              size={ICON_SIZE}
              color={isFocused ? '#00e5ff' : '#849396'}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Thông báo lỗi */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
});

export const styles = StyleSheet.create({
  fieldWrapper: {
    marginBottom: 20,
    width: '100%',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#849396',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  inputContainer: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b2527',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.5)',
    paddingHorizontal: 14,
  },
  inputContainerFocused: {
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  inputContainerError: {
    borderColor: '#ff4d4f',
  },
  leftIconWrapper: {
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#dce4e5',
    fontSize: 14,
    fontWeight: '500',
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  rightIconWrapper: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default LoginInputField;
