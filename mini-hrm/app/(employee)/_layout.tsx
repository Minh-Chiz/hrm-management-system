import { useAuth } from '@/context/AuthContext';
import { Redirect, Slot } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function EmployeeLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1516' }}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1516' }}>
        <Redirect href="/" />
      </View>
    );
  }

  return <Slot />;
}

