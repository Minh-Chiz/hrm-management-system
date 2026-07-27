import { useAuth } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import LoginScreen from './login';

export default function AuthGuard() {
  const { user, isLoading } = useAuth();

  // Show spinner while auth is resolving
  if (isLoading) {
    return (
      <View
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1516' }}
      >
        <ActivityIndicator size="large" color="#00e5ff" />
      </View>
    );
  }

  // Not authenticated → show login
  if (!user) {
    return <LoginScreen />;
  }

  // Authenticated → route by role via Expo Router Redirect so layouts (like Tabs) mount correctly
  switch (user.role) {
    case 'admin':
      return <Redirect href="/(admin)/dashboard" />;
    case 'teamlead':
      return <Redirect href="/(teamlead)/dashboard" />;
    case 'employee':
    default:
      return <Redirect href="/(employee)/dashboard" />;
  }
}

