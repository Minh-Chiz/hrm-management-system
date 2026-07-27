import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AlertBoxProps {
  message: string;
}

export function AlertBox({ message }: AlertBoxProps) {
  if (!message) return null;

  return (
    <View style={styles.container}>
      <MaterialIcons
        name="error-outline"
        size={18}
        color="#ff4d4f"
        style={styles.icon}
      />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 77, 79, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 79, 0.30)',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 8,
  },
  icon: {
    marginTop: 1,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    color: '#ff4d4f',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});
