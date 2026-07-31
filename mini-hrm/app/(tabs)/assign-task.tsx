import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { TaskAssignmentForm } from '@/features/teamlead';

export default function AssignTaskScreen() {
  const { user } = useAuth();

  // Protect screen - only teamlead or admin
  if (user && user.role !== 'teamlead' && user.role !== 'admin') {
    return <Redirect href="/(employee)/dashboard" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(teamlead)/dashboard'))}
        >
          <MaterialIcons name="arrow-back" size={22} color="#bac9cc" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Giao việc cho nhân viên</Text>
          <Text style={styles.headerSubtitle}>Tạo công việc mới, chọn nhân sự và thời hạn</Text>
        </View>
      </View>

      <View style={styles.content}>
        <TaskAssignmentForm onSuccess={() => router.replace('/(teamlead)/dashboard' as any)} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1516' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.3)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242b2d',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerTitle: { fontSize: 16, fontWeight: '700', color: '#dce4e5' },
  headerSubtitle: { fontSize: 11, color: '#849396' },
  content: { flex: 1, paddingHorizontal: 16 },
});