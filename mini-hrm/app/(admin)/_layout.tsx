import { useAuth } from '@/context/AuthContext';
import { Slot, Redirect } from 'expo-router';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function AdminLayout() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1516' }}>
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1516' }}>
        <Redirect href="/" />
      </View>
    );
  }

  return <Slot />;
}