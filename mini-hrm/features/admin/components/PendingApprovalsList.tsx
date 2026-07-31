import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PendingRequest } from '@/types';

interface PendingApprovalsListProps {
  item: PendingRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const palette = ['#00e5ff', '#05e777', '#e9c400', '#ffb4ab', '#c3f5ff'];
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) return palette[0];
  return palette[parsed % palette.length];
}

export function PendingApprovalsList({ item, onApprove, onReject }: PendingApprovalsListProps) {
  const avatarColor = getAvatarColor(item.id);
  const isPending = item.status === 'pending';

  const statusConfig = {
    pending: { label: 'Chờ duyệt', bg: 'rgba(233,196,0,0.15)', text: '#e9c400' },
    approved: { label: 'Đã duyệt', bg: 'rgba(5,231,119,0.15)', text: '#05e777' },
    rejected: { label: 'Đã từ chối', bg: 'rgba(255,180,171,0.15)', text: '#ffb4ab' },
  }[item.status];

  const typeIconName =
    item.type === 'Nghỉ phép'
      ? 'event-busy'
      : item.type === 'WFH'
      ? 'home-work'
      : item.type === 'OT'
      ? 'more-time'
      : 'edit-calendar';

  return (
    <View style={[styles.card, { borderLeftColor: item.accentColor || '#e9c400' }]}>
      {/* Top row */}
      <View style={styles.cardHeader}>
        <View style={[styles.avatarCircle, { backgroundColor: `${avatarColor}1A`, borderColor: avatarColor }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>{getInitials(item.senderName)}</Text>
        </View>

        <View style={styles.cardHeaderMeta}>
          <Text style={styles.senderName}>
            {item.senderName} <Text style={styles.roleTag}>• {item.role}</Text>
          </Text>
          <Text style={styles.timeAgo}>{item.timeAgo}</Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
          <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>{statusConfig.label}</Text>
        </View>
      </View>

      {/* Type chip */}
      <View style={styles.typeChipRow}>
        <View style={styles.typeChip}>
          <MaterialIcons name={typeIconName} size={12} color="#bac9cc" />
          <Text style={styles.typeChipText}>{item.type}</Text>
        </View>
        <Text style={styles.dateText}>{item.date}</Text>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        <Text style={{ fontWeight: '700', color: '#dce4e5' }}>{item.description}</Text>
        {item.reason ? <Text style={{ color: '#849396', fontWeight: '400' }}>{` — Lý do: ${item.reason}`}</Text> : null}
      </Text>

      {/* Attachment if present */}
      {item.hasAttachment && (
        <View style={styles.attachmentBtn}>
          <MaterialIcons name="attach-file" size={14} color="#00daf3" />
          <Text style={styles.attachmentText} numberOfLines={1}>
            {item.attachmentName || 'Đính kèm'}
          </Text>
        </View>
      )}

      {/* Actions */}
      {isPending ? (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.rejectBtn} onPress={() => onReject(item.id)} activeOpacity={0.75}>
            <MaterialIcons name="close" size={15} color="#ffb4ab" />
            <Text style={styles.rejectBtnText}>TỪ CHỐI</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.approveBtn} onPress={() => onApprove(item.id)} activeOpacity={0.75}>
            <MaterialIcons name="check" size={15} color="#003918" />
            <Text style={styles.approveBtnText}>PHÊ DUYỆT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.resultBanner, item.status === 'approved' ? styles.resultBannerApproved : styles.resultBannerRejected]}>
          <MaterialIcons name={item.status === 'approved' ? 'check-circle' : 'cancel'} size={14} color={item.status === 'approved' ? '#05e777' : '#ffb4ab'} />
          <Text style={[styles.resultBannerText, { color: item.status === 'approved' ? '#05e777' : '#ffb4ab' }]}>
            {item.status === 'approved' ? 'Đã phê duyệt yêu cầu này' : 'Đã từ chối yêu cầu này'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.65)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 4,
    gap: 8,
    marginBottom: 10,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: '700' },
  cardHeaderMeta: { flex: 1 },
  senderName: { fontSize: 13, fontWeight: '700', color: '#dce4e5' },
  roleTag: { color: '#849396', fontWeight: '400', fontSize: 11 },
  timeAgo: { fontSize: 10, color: '#849396', marginTop: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText: { fontSize: 10, fontWeight: '700' },
  typeChipRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeChipText: { fontSize: 11, color: '#bac9cc', fontWeight: '600' },
  dateText: { fontSize: 11, color: '#849396' },
  description: { fontSize: 12, color: '#dce4e5', lineHeight: 18 },
  attachmentBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 218, 243, 0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  attachmentText: { fontSize: 11, color: '#00daf3' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  rejectBtn: { flex: 1, height: 34, borderRadius: 6, backgroundColor: 'rgba(255, 180, 171, 0.12)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  rejectBtnText: { color: '#ffb4ab', fontWeight: '700', fontSize: 11 },
  approveBtn: { flex: 1, height: 34, borderRadius: 6, backgroundColor: '#05e777', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  approveBtnText: { color: '#003918', fontWeight: '800', fontSize: 11 },
  resultBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 6, marginTop: 2 },
  resultBannerApproved: { backgroundColor: 'rgba(5, 231, 119, 0.08)' },
  resultBannerRejected: { backgroundColor: 'rgba(255, 180, 171, 0.08)' },
  resultBannerText: { fontSize: 11, fontWeight: '600' },
});
