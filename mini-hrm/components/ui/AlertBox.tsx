import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themed-text';

export type AlertType = 'error' | 'warning' | 'info' | 'success';

export interface AlertBoxProps {
  message?: string;
  title?: string;
  type?: AlertType;
  onClose?: () => void;
  style?: ViewStyle;
  className?: string;
}

export function AlertBox({
  message,
  title,
  type = 'error',
  onClose,
  style,
  className = '',
}: AlertBoxProps) {
  if (!message) return null;

  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: 'warning' as const,
          color: '#faad14',
          bgColor: 'rgba(250, 173, 20, 0.10)',
          borderColor: 'rgba(250, 173, 20, 0.30)',
        };
      case 'info':
        return {
          icon: 'info' as const,
          color: '#1890ff',
          bgColor: 'rgba(24, 144, 255, 0.10)',
          borderColor: 'rgba(24, 144, 255, 0.30)',
        };
      case 'success':
        return {
          icon: 'check-circle' as const,
          color: '#52c41a',
          bgColor: 'rgba(82, 196, 26, 0.10)',
          borderColor: 'rgba(82, 196, 26, 0.30)',
        };
      case 'error':
      default:
        return {
          icon: 'error-outline' as const,
          color: '#ff4d4f',
          bgColor: 'rgba(255, 77, 79, 0.10)',
          borderColor: 'rgba(255, 77, 79, 0.30)',
        };
    }
  };

  const config = getTypeConfig();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
        },
        style,
      ]}
      className={className}
    >
      <MaterialIcons
        name={config.icon}
        size={18}
        color={config.color}
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        {title ? (
          <ThemedText style={[styles.title, { color: config.color }]}>
            {title}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.text, { color: config.color }]}>
          {message}
        </ThemedText>
      </View>

      {onClose ? (
        <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
          <MaterialIcons name="close" size={16} color={config.color} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 2,
    marginLeft: 4,
  },
});

export default AlertBox;
