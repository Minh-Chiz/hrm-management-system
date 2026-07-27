import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useData } from '@/context/DataContext';

import ManageUsersScreen from './manage-users';
import AdminTasksScreen from './tasks';
import ApproveRequestsScreen from './approve-requests';
import { EditProfileModal } from '@/components/EditProfileModal';

// ─── Animated scale-press wrapper ────────────────────────────────────────────

function ScalePress({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object | object[];
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const onIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 60 }).start();
  const onOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 60 }).start();
  return (
    <Pressable onPress={onPress} onPressIn={onIn} onPressOut={onOut}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { employees, requests, checkIns } = useData();
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const insets = useSafeAreaInsets();
  const initialNav = params.tab && ['overview', 'employees', 'tasks', 'approval'].includes(params.tab)
    ? (params.tab as 'overview' | 'employees' | 'tasks' | 'approval')
    : 'overview';
  const [activeNav, setActiveNav] = useState<'overview' | 'employees' | 'tasks' | 'approval'>(initialNav);

  React.useEffect(() => {
    if (params.tab && ['overview', 'employees', 'tasks', 'approval'].includes(params.tab)) {
      setActiveNav(params.tab as 'overview' | 'employees' | 'tasks' | 'approval');
    }
  }, [params.tab]);

  const todayStr = new Date().toLocaleDateString('vi-VN');

  // Tính số lượng nhân viên online hôm nay
  const todayCheckIns = checkIns.filter(c => c.date === todayStr);
  const userLatestStatus: { [userId: string]: 'in' | 'out' } = {};

  todayCheckIns.forEach(c => {
    if (userLatestStatus[c.userId] === undefined) {
      userLatestStatus[c.userId] = c.type;
    }
  });

  const onlineCount = employees.filter(e => e.status === 'Active').length;
  const totalEmp = employees.length;

  const pendingRequestsCount = requests.filter(r => r.status === 'pending').length;

  const todayLeavesCount = requests.filter(r =>
    r.type === 'Nghỉ phép' &&
    r.status === 'approved' &&
    r.date === todayStr
  ).length;

  const METRICS = [
    {
      id: 'online',
      label: 'Nhân viên Online',
      value: String(onlineCount),
      subValue: `/${totalEmp}`,
      icon: 'groups',
      iconColor: '#62ff96',
      borderColor: '#62ff96',
      span: 2,
    },
    {
      id: 'pending_tasks',
      label: 'Đơn cần duyệt',
      value: String(pendingRequestsCount),
      icon: 'warning',
      iconColor: '#e9c400',
      borderColor: '#e9c400',
      span: 1,
    },
    {
      id: 'leaves',
      label: 'Nghỉ phép hôm nay',
      value: String(todayLeavesCount),
      icon: 'calendar-today',
      iconColor: '#ffb4ab',
      borderColor: '#ffb4ab',
      span: 1,
    },
  ];

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const NAV_TABS = [
    { id: 'overview', icon: 'dashboard', label: 'Tổng quan' },
    { id: 'employees', icon: 'groups', label: 'Nhân sự' },
    { id: 'tasks', icon: 'assignment-turned-in', label: 'Công việc' },
    { id: 'approval', icon: 'fact-check', label: 'Phê duyệt', badge: pendingRequestsCount },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      {activeNav === 'overview' ? (
        <>
          {/* ── Top App Bar ── */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatar}>
                <MaterialIcons name="admin-panel-settings" size={20} color="#00daf3" />
              </View>
              <Text style={styles.headerGreeting}>
                Xin chào,{' '}
                <Text style={styles.headerName}>{user?.name ?? 'Quản trị viên'}</Text>
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7} onPress={() => setShowEditProfileModal(true)}>
                <MaterialIcons name="edit" size={20} color="#00e5ff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={logout} activeOpacity={0.7}>
                <MaterialIcons name="logout" size={20} color="#ff4d4f" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 80, 100) }]}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={16}
            decelerationRate="normal"
          >
            {/* ── Metrics Bento Grid ── */}
            <View style={styles.bentoGrid}>
              {/* Large card: Online employees → navigate to manage-users */}
              <ScalePress
                onPress={() => setActiveNav('employees')}
                style={[
                  styles.glassCard,
                  styles.bentoLarge,
                  { borderLeftColor: METRICS[0].borderColor },
                ]}
              >
                <View style={styles.bentoLargeContent}>
                  <View>
                    <Text style={styles.bentoLargeLabel}>{METRICS[0].label.toUpperCase()}</Text>
                    <View style={styles.bentoLargeValueRow}>
                      <Text style={styles.bentoLargeValue}>{METRICS[0].value}</Text>
                      <Text style={styles.bentoLargeSubValue}>{METRICS[0].subValue}</Text>
                    </View>
                    <View style={styles.cardNavHint}>
                      <Text style={styles.cardNavHintText}>Quản lý nhân sự</Text>
                      <MaterialIcons name="chevron-right" size={12} color="#849396" />
                    </View>
                  </View>
                  <View
                    style={[
                      styles.bentoIconWrapper,
                      { backgroundColor: `${METRICS[0].iconColor}18` },
                    ]}
                  >
                    <MaterialIcons
                      name={METRICS[0].icon as keyof typeof MaterialIcons.glyphMap}
                      size={26}
                      color={METRICS[0].iconColor}
                    />
                    {/* Pulse dot */}
                    <View
                      style={[styles.pulseDot, { backgroundColor: METRICS[0].iconColor }]}
                    />
                  </View>
                </View>
              </ScalePress>

              {/* Small cards row — each tappable */}
              <View style={styles.bentoSmallRow}>
                {/* Đơn cần duyệt → approve-requests */}
                <ScalePress
                  onPress={() => setActiveNav('approval')}
                  style={[
                    styles.glassCard,
                    styles.bentoSmall,
                    { borderLeftColor: METRICS[1].borderColor },
                  ]}
                >
                  <View style={styles.bentoSmallTop}>
                    <View style={[styles.bentoSmallIcon, { backgroundColor: `${METRICS[1].iconColor}18` }]}>
                      <MaterialIcons name={METRICS[1].icon as keyof typeof MaterialIcons.glyphMap} size={16} color={METRICS[1].iconColor} />
                    </View>
                    <Text style={[styles.bentoSmallValue, { color: METRICS[1].iconColor }]}>
                      {METRICS[1].value}
                    </Text>
                  </View>
                  <Text style={styles.bentoSmallLabel}>{METRICS[1].label}</Text>
                  <View style={styles.cardNavHint}>
                    <Text style={styles.cardNavHintText}>Xem & duyệt</Text>
                    <MaterialIcons name="chevron-right" size={11} color="#849396" />
                  </View>
                </ScalePress>

                {/* Nghỉ phép hôm nay → approve-requests */}
                <ScalePress
                  onPress={() => setActiveNav('approval')}
                  style={[
                    styles.glassCard,
                    styles.bentoSmall,
                    { borderLeftColor: METRICS[2].borderColor },
                  ]}
                >
                  <View style={styles.bentoSmallTop}>
                    <View style={[styles.bentoSmallIcon, { backgroundColor: `${METRICS[2].iconColor}18` }]}>
                      <MaterialIcons name={METRICS[2].icon as keyof typeof MaterialIcons.glyphMap} size={16} color={METRICS[2].iconColor} />
                    </View>
                    <Text style={[styles.bentoSmallValue, { color: METRICS[2].iconColor }]}>
                      {METRICS[2].value}
                    </Text>
                  </View>
                  <Text style={styles.bentoSmallLabel}>{METRICS[2].label}</Text>
                  <View style={styles.cardNavHint}>
                    <Text style={styles.cardNavHintText}>Xem đơn</Text>
                    <MaterialIcons name="chevron-right" size={11} color="#849396" />
                  </View>
                </ScalePress>
              </View>
            </View>


            {/* ── Recent Activity ── */}
            <View style={styles.activitySection}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>Hoạt động gần đây</Text>
                <TouchableOpacity
                  onPress={() => setActiveNav('employees')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.seeAllText}>Xem tất cả</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.activityList}>
                {checkIns.length === 0 ? (
                  <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                    <MaterialIcons name="fingerprint" size={32} color="#3b494c" />
                    <Text style={{ color: '#849396', fontSize: 13, marginTop: 8 }}>Chưa có hoạt động điểm danh nào</Text>
                  </View>
                ) : (
                  checkIns.slice(0, 5).map((item) => {
                    const isCI = item.type === 'in';
                    return (
                      <View
                        key={item.id}
                        style={styles.activityItem}
                      >
                        <View
                          style={[
                            styles.activityIcon,
                            { backgroundColor: isCI ? 'rgba(98, 255, 150, 0.10)' : 'rgba(255, 180, 171, 0.08)' }
                          ]}
                        >
                          <MaterialIcons
                            name={isCI ? 'login' : 'logout'}
                            size={18}
                            color={isCI ? '#62ff96' : '#ffb4ab'}
                          />
                        </View>
                        <View style={styles.activityText}>
                          <Text
                            style={styles.activityDesc}
                            numberOfLines={1}
                          >
                            <Text style={{ fontWeight: 'bold', color: '#00daf3' }}>{item.userName}</Text>
                            {isCI ? ' vừa Check-in' : ' vừa Check-out'}
                          </Text>
                          <Text style={styles.activityTime}>
                            {item.time} — {item.date === todayStr ? 'Hôm nay' : item.date}
                          </Text>
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
        <View style={{ flex: 1, paddingBottom: 60 }}>
          <ManageUsersScreen hideBackButton={true} />
        </View>
      ) : activeNav === 'tasks' ? (
        <View style={{ flex: 1, paddingBottom: 60 }}>
          <AdminTasksScreen hideBackButton={true} />
        </View>
      ) : (
        <View style={{ flex: 1, paddingBottom: 60 }}>
          <ApproveRequestsScreen hideBackButton={true} />
        </View>
      )}

      {/* ── Fixed Bottom Navigation (4 Tabs) ── */}
      <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {NAV_TABS.map((tab) => {
          const isActive = tab.id === activeNav;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.navTab, isActive && styles.navTabActive]}
              onPress={() => setActiveNav(tab.id as 'overview' | 'employees' | 'tasks' | 'approval')}
              activeOpacity={0.75}
            >
              <View style={{ position: 'relative' }}>
                <MaterialIcons
                  name={tab.icon as keyof typeof MaterialIcons.glyphMap}
                  size={22}
                  color={isActive ? '#00daf3' : '#849396'}
                />
                {tab.badge && tab.badge > 0 ? (
                  <View style={styles.navBadge}>
                    <Text style={styles.navBadgeText}>{tab.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {/* ── Edit Profile Modal ── */}
      <EditProfileModal
        visible={showEditProfileModal}
        onClose={() => setShowEditProfileModal(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1516' },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#0d1516',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.3)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 218, 243, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerGreeting: { fontSize: 14, color: '#bac9cc' },
  headerName: { color: '#00daf3', fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#242b2d',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Scroll */
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 20 },

  /* Bento Grid */
  bentoGrid: { gap: 12 },
  glassCard: {
    backgroundColor: 'rgba(30, 30, 30, 0.65)',
    borderRadius: 14,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  bentoLarge: {
    padding: 16,
  },
  bentoLargeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bentoLargeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#849396',
    letterSpacing: 1,
    marginBottom: 4,
  },
  bentoLargeValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bentoLargeValue: { fontSize: 32, fontWeight: '700', color: '#dce4e5', lineHeight: 38 },
  bentoLargeSubValue: { fontSize: 18, fontWeight: '600', color: '#849396', marginBottom: 4 },
  bentoIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pulseDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0d1516',
  },
  bentoSmallRow: { flexDirection: 'row', gap: 12 },
  bentoSmall: {
    flex: 1,
    padding: 14,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  bentoSmallTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bentoSmallIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  bentoSmallValue: { fontSize: 26, fontWeight: '700' },
  bentoSmallLabel: { fontSize: 11, color: '#849396', fontWeight: '500', marginTop: 8 },

  /* Tappable card nav hint */
  cardNavHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 6,
  },
  cardNavHintText: {
    fontSize: 10,
    color: '#849396',
    fontWeight: '500',
    letterSpacing: 0.2,
  },

  /* Activity */
  activitySection: {},
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  activityTitle: { fontSize: 17, fontWeight: '700', color: '#dce4e5' },
  seeAllText: { fontSize: 12, color: '#00daf3', fontWeight: '600' },
  activityList: { gap: 10 },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(30, 30, 30, 0.6)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  activityItemDimmed: { opacity: 0.65 },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  activityText: { flex: 1 },
  activityDesc: { fontSize: 13, color: '#dce4e5', fontWeight: '500' },
  activityTime: { fontSize: 11, color: '#849396', marginTop: 3 },

  /* Bottom nav */
  bottomNav: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.3)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  navTab: { flex: 1, alignItems: 'center', paddingVertical: 5, borderRadius: 10, gap: 2 },
  navTabActive: { backgroundColor: 'rgba(0, 218, 243, 0.10)' },
  navLabel: { fontSize: 10, color: '#849396', fontWeight: '500' },
  navLabelActive: { color: '#00daf3', fontWeight: '700' },
  navBadge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#ff4d4f',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  navBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
});