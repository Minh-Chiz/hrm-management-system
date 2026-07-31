import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useAdminDashboard, AdminStatsWidget } from '@/features/admin';
import ManageUsersScreen from './manage-users';
import AdminTasksScreen from './tasks';
import ApproveRequestsScreen from './approve-requests';
import { EditProfileModal } from '@/components/EditProfileModal';

type NavTabId = 'overview' | 'employees' | 'tasks' | 'approval';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { stats, recentActivity, todayStr } = useAdminDashboard();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const [activeNav, setActiveNav] = useState<NavTabId>('overview');
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  useEffect(() => {
    if (params.tab && ['overview', 'employees', 'tasks', 'approval'].includes(params.tab)) {
      setActiveNav(params.tab as NavTabId);
    }
  }, [params.tab]);

  const NAV_TABS = [
    { id: 'overview', icon: 'dashboard', label: 'Tổng quan' },
    { id: 'employees', icon: 'groups', label: 'Nhân sự' },
    { id: 'tasks', icon: 'assignment-turned-in', label: 'Công việc' },
    { id: 'approval', icon: 'fact-check', label: 'Phê duyệt', badge: stats.pendingRequestsCount },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {activeNav === 'overview' ? (
        <>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <MaterialIcons name="admin-panel-settings" size={20} color="#00daf3" />
              </View>
              <Text style={styles.headerGreeting}>
                Xin chào, <Text style={styles.headerName}>{user?.name ?? 'Quản trị viên'}</Text>
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} onPress={logout}>
                <MaterialIcons name="logout" size={20} color="#ff4d4f" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}>
            <AdminStatsWidget
              onlineCount={stats.onlineCount}
              totalEmployees={stats.totalEmployees}
              pendingRequestsCount={stats.pendingRequestsCount}
              todayLeavesCount={stats.todayLeavesCount}
              onNavigateTab={(tab) => setActiveNav(tab)}
            />

            <View style={styles.activitySection}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>Hoạt động gần đây</Text>
                <TouchableOpacity onPress={() => setActiveNav('employees')}>
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.activityList}>
                {recentActivity.length === 0 ? (
                  <View style={styles.emptyActivity}>
                    <MaterialIcons name="fingerprint" size={32} color="#3b494c" />
                    <Text style={styles.emptyText}>Chưa có hoạt động điểm danh nào</Text>
                  </View>
                ) : (
                  recentActivity.map((item) => {
                    const isCI = item.type === 'in';
                    return (
                      <View key={item.id} style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: isCI ? 'rgba(98, 255, 150, 0.10)' : 'rgba(255, 180, 171, 0.08)' }]}>
                          <MaterialIcons name={isCI ? 'login' : 'logout'} size={18} color={isCI ? '#62ff96' : '#ffb4ab'} />
                        </View>
                        <View style={styles.activityText}>
                          <Text style={styles.activityDesc} numberOfLines={1}>
                            <Text style={{ fontWeight: 'bold', color: '#00daf3' }}>{item.userName}</Text>
                            {isCI ? ' vừa Check-in' : ' vừa Check-out'}
                          </Text>
                          <Text style={styles.activityTime}>{item.time} — {item.date === todayStr ? 'Hôm nay' : item.date}</Text>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </View>
          </ScrollView>
        </>
      ) : activeNav === 'employees' ? (
        <View style={styles.subScreenContainer}><ManageUsersScreen hideBackButton /></View>
      ) : activeNav === 'tasks' ? (
        <View style={styles.subScreenContainer}><AdminTasksScreen hideBackButton /></View>
      ) : (
        <View style={styles.subScreenContainer}><ApproveRequestsScreen hideBackButton /></View>
      )}

      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {NAV_TABS.map((tab) => {
          const isActive = tab.id === activeNav;
          return (
            <TouchableOpacity key={tab.id} style={[styles.navTab, isActive && styles.navTabActive]} onPress={() => setActiveNav(tab.id as NavTabId)}>
              <View>
                <MaterialIcons name={tab.icon as any} size={22} color={isActive ? '#00daf3' : '#849396'} />
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.navBadge}><Text style={styles.navBadgeText}>{tab.badge}</Text></View>
                ) : null}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <EditProfileModal visible={showEditProfileModal} onClose={() => setShowEditProfileModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1516' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, backgroundColor: '#0d1516', borderBottomWidth: 1, borderBottomColor: 'rgba(59, 73, 76, 0.3)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0, 218, 243, 0.10)', borderWidth: 1, borderColor: 'rgba(0, 218, 243, 0.25)', alignItems: 'center', justifyContent: 'center' },
  headerGreeting: { fontSize: 14, color: '#bac9cc' },
  headerName: { color: '#00daf3', fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20 },
  activitySection: {},
  activityHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  activityTitle: { fontSize: 17, fontWeight: '700', color: '#dce4e5' },
  seeAllText: { fontSize: 12, color: '#00daf3', fontWeight: '600' },
  activityList: { gap: 10 },
  emptyActivity: { paddingVertical: 32, alignItems: 'center' },
  emptyText: { color: '#849396', fontSize: 13, marginTop: 8 },
  activityItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(30, 30, 30, 0.6)', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.04)' },
  activityIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  activityText: { flex: 1 },
  activityDesc: { fontSize: 13, color: '#dce4e5', fontWeight: '500' },
  activityTime: { fontSize: 11, color: '#849396', marginTop: 3 },
  subScreenContainer: { flex: 1, paddingBottom: 60 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4, paddingTop: 8, paddingBottom: 16, backgroundColor: 'rgba(30, 30, 30, 0.9)', borderTopWidth: 1, borderTopColor: 'rgba(59, 73, 76, 0.3)', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  navTab: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 10, gap: 2 },
  navTabActive: { backgroundColor: 'rgba(0, 218, 243, 0.10)' },
  navLabel: { fontSize: 10, color: '#849396', fontWeight: '500' },
  navLabelActive: { color: '#00daf3', fontWeight: '700' },
  navBadge: { position: 'absolute', top: -4, right: -10, backgroundColor: '#ff4d4f', borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  navBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
});