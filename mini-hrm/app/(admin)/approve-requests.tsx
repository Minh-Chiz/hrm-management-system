import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useData } from '@/context/DataContext';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType = 'Nghỉ phép' | 'WFH' | 'Chấm công bù' | 'OT';
type RequestStatus = 'pending' | 'approved' | 'rejected';
type TabId = 'leave' | 'overtime';

interface PendingRequest {
  id: string;
  senderName: string;
  role: string;
  type: RequestType;
  description: string;
  reason: string;
  date: string;
  timeAgo: string;
  status: RequestStatus;
  accentColor: string; // left-border accent per card
  hasAttachment?: boolean;
  attachmentName?: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const INITIAL_REQUESTS: PendingRequest[] = [
  {
    id: '1',
    senderName: 'Lê Thị B',
    role: 'Tester',
    type: 'Nghỉ phép',
    description: 'Xin nghỉ phép chiều Thứ 4 (15/07)',
    reason: 'Đi khám răng',
    date: '15/07/2026',
    timeAgo: 'Vừa xong',
    status: 'pending',
    accentColor: '#e9c400',
  },
  {
    id: '2',
    senderName: 'Trần Văn C',
    role: 'Dev',
    type: 'Nghỉ phép',
    description: 'Xin nghỉ phép nguyên ngày Thứ 6 (17/07)',
    reason: 'Việc gia đình',
    date: '17/07/2026',
    timeAgo: '2 giờ trước',
    status: 'pending',
    accentColor: '#e9c400',
  },
  {
    id: '3',
    senderName: 'Nguyễn Minh C',
    role: 'Designer',
    type: 'WFH',
    description: 'Xin làm việc tại nhà Thứ 2 (20/07)',
    reason: 'Sửa nhà, không thể đến văn phòng',
    date: '20/07/2026',
    timeAgo: '5 giờ trước',
    status: 'pending',
    accentColor: '#00daf3',
  },
  {
    id: '4',
    senderName: 'Phạm Thu D',
    role: 'PM',
    type: 'WFH',
    description: 'Xin làm việc tại nhà cả tuần (21-25/07)',
    reason: 'Chăm sóc người thân ốm',
    date: '21-25/07/2026',
    timeAgo: 'Hôm qua',
    status: 'pending',
    accentColor: '#00daf3',
  },
  {
    id: '5',
    senderName: 'Hoàng Văn E',
    role: 'Backend Dev',
    type: 'Chấm công bù',
    description: 'Chấm công bù ngày 12/07 (quên check-in)',
    reason: 'Vào muộn do tắc đường, quên bấm check-in',
    date: '12/07/2026',
    timeAgo: '1 ngày trước',
    status: 'pending',
    accentColor: '#c3f5ff',
  },
  {
    id: '6',
    senderName: 'Trần Lan F',
    role: 'QA',
    type: 'Chấm công bù',
    description: 'Chấm công bù ngày 10/07 (lỗi hệ thống)',
    reason: 'Hệ thống chấm công bị lỗi, không ghi nhận',
    date: '10/07/2026',
    timeAgo: '3 ngày trước',
    status: 'pending',
    accentColor: '#c3f5ff',
  },
  {
    id: '7',
    senderName: 'Nguyễn Văn A',
    role: 'Dev',
    type: 'OT',
    description: 'Xin OT dự án cuối tuần (19-20/07)',
    reason: 'Chạy kịp tiến độ release',
    date: '19-20/07/2026',
    timeAgo: '4 giờ trước',
    status: 'pending',
    accentColor: '#b388ff',
    hasAttachment: true,
    attachmentName: 'bang_cham_cong_tay.pdf',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const palette = ['#00e5ff', '#05e777', '#e9c400', '#ffb4ab', '#c3f5ff'];
  return palette[parseInt(id, 10) % palette.length];
}

// ─── Request Card ─────────────────────────────────────────────────────────────

interface RequestCardProps {
  item: PendingRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function RequestCard({ item, onApprove, onReject }: RequestCardProps) {
  const avatarColor = getAvatarColor(item.id);
  const isPending = item.status === 'pending';

  const statusConfig = {
    pending: { label: 'Chờ duyệt',   bg: 'rgba(233,196,0,0.15)',    text: '#e9c400' },
    approved: { label: 'Đã duyệt',   bg: 'rgba(5,231,119,0.15)',    text: '#05e777' },
    rejected: { label: 'Đã từ chối', bg: 'rgba(255,180,171,0.15)',  text: '#ffb4ab' },
  }[item.status];

  return (
    <View style={[styles.card, { borderLeftColor: item.accentColor }]}>
      {/* ── Top: Avatar + Name + Status badge ── */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: `${avatarColor}1A`, borderColor: avatarColor }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>
            {getInitials(item.senderName)}
          </Text>
        </View>

        <View style={styles.cardHeaderMeta}>
          <Text style={styles.senderName}>
            {item.senderName}{' '}
            <Text style={styles.roleTag}>• {item.role}</Text>
          </Text>
          <Text style={styles.timeAgo}>{item.timeAgo}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
      </View>

      {/* ── Type chip ── */}
      <View style={styles.typeChipRow}>
        <View style={styles.typeChip}>
          <MaterialIcons
            name={item.type === 'Nghỉ phép' ? 'event-busy' : item.type === 'WFH' ? 'home-work' : item.type === 'OT' ? 'more-time' : 'edit-calendar'}
            size={12}
            color="#bac9cc"
          />
          <Text style={styles.typeChipText}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      {/* ── Description & Reason (Combined & Compact) ── */}
      <Text style={styles.description} numberOfLines={3}>
        <Text style={{ fontWeight: '700', color: '#dce4e5' }}>{item.description}</Text>
        {item.reason ? <Text style={{ color: '#849396', fontWeight: '400' }}>{` — Lý do: ${item.reason}`}</Text> : null}
      </Text>

      {/* ── Attachment ── */}
      {item.hasAttachment && (
        <TouchableOpacity
          style={styles.attachmentBtn}
          activeOpacity={0.7}
          onPress={() => {}}
        >
          <MaterialIcons name="attach-file" size={15} color="#00daf3" />
          <Text style={styles.attachmentText} numberOfLines={1}>
            {item.attachmentName}
          </Text>
          <MaterialIcons name="file-download" size={14} color="#00daf3" style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}

      {/* ── Action Buttons (only when pending) ── */}
      {isPending ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.rejectBtn}
            onPress={() => onReject(item.id)}
            activeOpacity={0.75}
          >
            <MaterialIcons name="close" size={15} color="#ffb4ab" />
            <Text style={styles.rejectBtnText}>TỪ CHỐI</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.approveBtn}
            onPress={() => onApprove(item.id)}
            activeOpacity={0.75}
          >
            <MaterialIcons name="check" size={15} color="#003918" />
            <Text style={styles.approveBtnText}>PHÊ DUYỆT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Result banner ── */
        <View style={[
          styles.resultBanner,
          item.status === 'approved' ? styles.resultBannerApproved : styles.resultBannerRejected,
        ]}>
          <MaterialIcons
            name={item.status === 'approved' ? 'check-circle' : 'cancel'}
            size={14}
            color={item.status === 'approved' ? '#05e777' : '#ffb4ab'}
          />
          <Text style={[
            styles.resultBannerText,
            { color: item.status === 'approved' ? '#05e777' : '#ffb4ab' },
          ]}>
            {item.status === 'approved' ? 'Đã phê duyệt yêu cầu này' : 'Đã từ chối yêu cầu này'}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ApproveRequestsScreen({ hideBackButton = false }: { hideBackButton?: boolean } = {}) {
  const { requests, updateRequestStatus } = useData();
  const [activeTab, setActiveTab] = useState<TabId>('leave');

  // Filter by tab
  const LEAVE_TYPES: RequestType[] = ['Nghỉ phép', 'WFH'];
  const OVERTIME_TYPES: RequestType[] = ['Chấm công bù', 'OT'];

  const filtered = requests.filter((r) =>
    activeTab === 'leave'
      ? LEAVE_TYPES.includes(r.type)
      : OVERTIME_TYPES.includes(r.type)
  );

  const pendingCount = filtered.filter((r) => r.status === 'pending').length;

  const handleApprove = (id: string) => {
    updateRequestStatus(id, 'approved');
  };

  const handleReject = (id: string) => {
    updateRequestStatus(id, 'rejected');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!hideBackButton && (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(admin)/dashboard');
                }
              }}
              activeOpacity={0.75}
            >
              <MaterialIcons name="arrow-back" size={22} color="#bac9cc" />
            </TouchableOpacity>
          )}
          <View style={{ marginLeft: hideBackButton ? 0 : 8 }}>
            <Text style={styles.headerTitle}>Phê duyệt Yêu cầu</Text>
            {pendingCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {pendingCount} yêu cầu chờ xử lý
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.filterBtn} activeOpacity={0.75}>
          <MaterialIcons name="filter-list" size={20} color="#dce4e5" />
        </TouchableOpacity>
      </View>

      {/* ── Segmented Tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        {([
          { id: 'leave' as TabId, label: 'Xin nghỉ phép / WFH' },
          { id: 'overtime' as TabId, label: 'Chấm công bù / OT' },
        ] as const).map((tab) => {
          const isActive = activeTab === tab.id;
          const tabCount = requests.filter((r) =>
            tab.id === 'leave'
              ? LEAVE_TYPES.includes(r.type) && r.status === 'pending'
              : OVERTIME_TYPES.includes(r.type) && r.status === 'pending'
          ).length;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.75}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {tabCount > 0 && (
                <View style={[styles.tabBadge, isActive && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, isActive && styles.tabBadgeTextActive]}>
                    {tabCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Card List ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color="#3b494c" />
            <Text style={styles.emptyTitle}>Không có yêu cầu</Text>
            <Text style={styles.emptySubtitle}>
              Tất cả yêu cầu trong danh mục này đã được xử lý.
            </Text>
          </View>
        ) : (
          filtered.map((item) => (
            <RequestCard
              key={item.id}
              item={item}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          ))
        )}

        <View style={{ height: 140 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1516',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 56,
    backgroundColor: '#0d1516',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.35)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#192122',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#dce4e5',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#00daf3',
    marginTop: 1,
    fontWeight: '500',
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#192122',
  },

  /* ── Tabs ── */
  tabBar: {
    backgroundColor: '#0d1516',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.35)',
    flexGrow: 0,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    flexShrink: 0,
  },
  tabActive: {
    borderBottomColor: '#00daf3',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#849396',
    textAlign: 'center',
  },
  tabTextActive: {
    color: '#00daf3',
  },
  tabBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(132, 147, 150, 0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(0, 218, 243, 0.18)',
  },
  tabBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#849396',
  },
  tabBadgeTextActive: {
    color: '#00daf3',
  },

  /* ── Scroll ── */
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 140,
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 0,
  },

  /* Card header */
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
  },
  cardHeaderMeta: {
    flex: 1,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dce4e5',
    lineHeight: 18,
  },
  roleTag: {
    fontWeight: '400',
    color: '#849396',
  },
  timeAgo: {
    fontSize: 11,
    color: '#849396',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    flexShrink: 0,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Type chip + date row */
  typeChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#242b2d',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.5)',
  },
  typeChipText: {
    fontSize: 10,
    color: '#bac9cc',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dateText: {
    fontSize: 11,
    color: '#849396',
  },

  /* Description */
  description: {
    fontSize: 13,
    color: '#bac9cc',
    marginBottom: 10,
    lineHeight: 18,
  },

  /* Reason box */
  reasonBox: {
    backgroundColor: '#151d1e',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2e3638',
    marginBottom: 14,
  },
  reasonLabel: {
    fontSize: 13,
    color: '#849396',
    lineHeight: 18,
  },
  reasonText: {
    color: '#dce4e5',
    fontWeight: '500',
  },

  /* Action buttons */
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rejectBtn: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 180, 171, 0.60)',
    backgroundColor: 'rgba(255, 180, 171, 0.06)',
  },
  rejectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffb4ab',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  approveBtn: {
    flex: 1,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderRadius: 8,
    backgroundColor: '#05e777',
    shadowColor: '#05e777',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  approveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#003918',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  /* Attachment button */
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#151d1e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.25)',
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  attachmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00daf3',
    flex: 1,
  },

  /* Result banner (after action) */
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  resultBannerApproved: {
    backgroundColor: 'rgba(5, 231, 119, 0.08)',
    borderColor: 'rgba(5, 231, 119, 0.25)',
  },
  resultBannerRejected: {
    backgroundColor: 'rgba(255, 180, 171, 0.08)',
    borderColor: 'rgba(255, 180, 171, 0.25)',
  },
  resultBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },

  /* Empty state */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#849396',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#3b494c',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },
});
