import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Employee } from '@/types';

interface TeamOverviewCardProps {
  onlineCount: number;
  totalCount: number;
  members: Employee[];
  completionRate: number;
  completedCount: number;
  totalTasks: number;
  inReviewCount: number;
  overdueCount: number;
  onPressAssignTask?: () => void;
}

export function TeamOverviewCard({
  onlineCount,
  totalCount,
  members,
  completionRate,
  completedCount,
  totalTasks,
  inReviewCount,
  overdueCount,
  onPressAssignTask,
}: TeamOverviewCardProps) {
  return (
    <View style={styles.card}>
      {/* Header availability */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="groups" size={22} color="#00daf3" />
          </View>
          <View>
            <Text style={styles.title}>Tổng quan Nhóm</Text>
            <Text style={styles.subtitle}>
              <Text style={{ color: '#05e777', fontWeight: '700' }}>{onlineCount}</Text>/{totalCount} nhân sự đang làm việc
            </Text>
          </View>
        </View>

        {onPressAssignTask && (
          <TouchableOpacity style={styles.assignBtn} onPress={onPressAssignTask} activeOpacity={0.75}>
            <MaterialIcons name="add-task" size={16} color="#00363d" />
            <Text style={styles.assignBtnText}>Giao việc</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Member Avatars */}
      <View style={styles.membersRow}>
        {members.slice(0, 5).map((m) => (
          <View key={m.id} style={styles.avatarWrap}>
            <View style={[styles.avatar, { backgroundColor: `${m.accentColor || '#00e5ff'}22`, borderColor: m.accentColor || '#00e5ff' }]}>
              <Text style={[styles.avatarText, { color: m.accentColor || '#00e5ff' }]}>
                {m.avatar || m.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </View>
        ))}
        {members.length > 5 && (
          <View style={styles.moreAvatar}>
            <Text style={styles.moreAvatarText}>+{members.length - 5}</Text>
          </View>
        )}
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>Tiến độ dự án nhóm</Text>
          <Text style={styles.progressValue}>{completionRate}% ({completedCount}/{totalTasks})</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
        </View>
      </View>

      {/* Stat Chips */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: 'rgba(233, 196, 0, 0.12)' }]}>
          <MaterialIcons name="fact-check" size={14} color="#e9c400" />
          <Text style={[styles.chipText, { color: '#e9c400' }]}>{inReviewCount} Chờ duyệt</Text>
        </View>

        <View style={[styles.chip, { backgroundColor: 'rgba(255, 180, 171, 0.12)' }]}>
          <MaterialIcons name="error-outline" size={14} color="#ffb4ab" />
          <Text style={[styles.chipText, { color: '#ffb4ab' }]}>{overdueCount} Trễ hạn</Text>
        </View>

        <View style={[styles.chip, { backgroundColor: 'rgba(5, 231, 119, 0.12)' }]}>
          <MaterialIcons name="task-alt" size={14} color="#05e777" />
          <Text style={[styles.chipText, { color: '#05e777' }]}>{completedCount} Hoàn thành</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.65)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 14,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0, 218, 243, 0.12)', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '700', color: '#dce4e5' },
  subtitle: { fontSize: 11, color: '#849396', marginTop: 2 },
  assignBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00daf3', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  assignBtnText: { fontSize: 12, fontWeight: '700', color: '#00363d' },
  membersRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatarWrap: { position: 'relative' },
  avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 11, fontWeight: '700' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: '#05e777', borderWidth: 1, borderColor: '#0d1516' },
  moreAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center' },
  moreAvatarText: { fontSize: 11, color: '#849396', fontWeight: '700' },
  progressContainer: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { fontSize: 12, color: '#849396', fontWeight: '500' },
  progressValue: { fontSize: 12, color: '#00daf3', fontWeight: '700' },
  progressBarTrack: { height: 6, backgroundColor: '#192122', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00daf3', borderRadius: 3 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  chipText: { fontSize: 11, fontWeight: '600' },
});
