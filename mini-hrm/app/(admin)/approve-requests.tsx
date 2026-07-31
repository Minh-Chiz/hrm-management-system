import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useRequestsQuery,
  useApproveRequestMutation,
  useUpdateRequestStatusMutation,
} from '@/hooks/queries/useRequestQueries';
import { PendingApprovalsList } from '@/features/admin';

type RequestType = 'Nghỉ phép' | 'WFH' | 'Chấm công bù' | 'OT';
type TabId = 'leave' | 'overtime';

export default function ApproveRequestsScreen({ hideBackButton = false }: { hideBackButton?: boolean } = {}) {
  const { data: requests = [], isLoading } = useRequestsQuery();
  const approveMutation = useApproveRequestMutation();
  const updateStatusMutation = useUpdateRequestStatusMutation();

  const [activeTab, setActiveTab] = useState<TabId>('leave');

  const LEAVE_TYPES: RequestType[] = ['Nghỉ phép', 'WFH'];
  const OVERTIME_TYPES: RequestType[] = ['Chấm công bù', 'OT'];

  const filtered = useMemo(() => {
    return requests.filter((r) =>
      activeTab === 'leave' ? LEAVE_TYPES.includes(r.type) : OVERTIME_TYPES.includes(r.type)
    );
  }, [requests, activeTab]);

  const pendingCount = useMemo(
    () => filtered.filter((r) => r.status === 'pending').length,
    [filtered]
  );

  const handleApprove = (id: string) => {
    approveMutation.mutate(id);
  };

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: 'rejected' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!hideBackButton && (
            <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(admin)/dashboard'))}>
              <MaterialIcons name="arrow-back" size={22} color="#bac9cc" />
            </TouchableOpacity>
          )}
          <View style={{ marginLeft: hideBackButton ? 0 : 8 }}>
            <Text style={styles.headerTitle}>Phê duyệt Yêu cầu</Text>
            {pendingCount > 0 && <Text style={styles.headerSubtitle}>{pendingCount} yêu cầu chờ xử lý</Text>}
          </View>
        </View>

        <TouchableOpacity style={styles.filterBtn}>
          <MaterialIcons name="filter-list" size={20} color="#dce4e5" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        {[
          { id: 'leave' as TabId, label: 'Xin nghỉ phép / WFH', types: LEAVE_TYPES },
          { id: 'overtime' as TabId, label: 'Chấm công bù / OT', types: OVERTIME_TYPES },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const tabCount = requests.filter((r) => tab.types.includes(r.type) && r.status === 'pending').length;

          return (
            <TouchableOpacity key={tab.id} style={[styles.tab, isActive && styles.tabActive]} onPress={() => setActiveTab(tab.id)}>
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              {tabCount > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>{tabCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color="#3b494c" />
            <Text style={styles.emptyTitle}>Không có yêu cầu</Text>
            <Text style={styles.emptySubtitle}>Tất cả yêu cầu trong danh mục này đã được xử lý.</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <PendingApprovalsList key={item.id} item={item} onApprove={handleApprove} onReject={handleReject} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1516' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(59, 73, 76, 0.3)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#dce4e5' },
  headerSubtitle: { fontSize: 11, color: '#849396' },
  filterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center' },
  tabBar: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 36, borderRadius: 8, backgroundColor: '#161f21', gap: 6 },
  tabActive: { backgroundColor: '#00daf3' },
  tabText: { fontSize: 12, color: '#849396', fontWeight: '500' },
  tabTextActive: { color: '#00363d', fontWeight: '700' },
  tabBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 },
  tabBadgeActive: { backgroundColor: '#00363d' },
  tabBadgeText: { fontSize: 10, color: '#849396', fontWeight: '700' },
  tabBadgeTextActive: { color: '#00daf3' },
  scroll: { flex: 1 },
  scrollContent: { padding: 12, paddingBottom: 80 },
  emptyState: { paddingVertical: 40, alignItems: 'center', gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: '#dce4e5' },
  emptySubtitle: { fontSize: 12, color: '#849396' },
});

