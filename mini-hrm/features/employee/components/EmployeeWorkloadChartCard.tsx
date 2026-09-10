import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PieChart } from 'react-native-gifted-charts';
import { TaskSummaryStats } from '../types/dashboard';

interface EmployeeWorkloadChartCardProps {
  stats: TaskSummaryStats;
  usedLeaveDays?: number;
  totalLeaveDays?: number;
}

export const EmployeeWorkloadChartCard: React.FC<EmployeeWorkloadChartCardProps> = ({
  stats,
  usedLeaveDays = 3,
  totalLeaveDays = 12,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  // Tính toán số lượng và tỷ lệ
  const completed = stats.completedTasks || 0;
  const inProgress = stats.inProgressTasks || 0;
  const pending = stats.pendingTasks || 0;
  const total = stats.totalTasks || 0;

  // Tránh chia 0 nếu chưa có task nào
  const completedPct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const pendingPct = total > 0 ? Math.max(0, 100 - completedPct - inProgressPct) : 0;

  // Dữ liệu cho PieChart (Donut)
  // Nếu chưa có task nào thì hiển thị 1 lát mặc định màu xám
  const pieData =
    total === 0
      ? [{ value: 1, color: '#3b494c' }]
      : [
          ...(completed > 0 ? [{ value: completed, color: '#05e777' }] : []),
          ...(inProgress > 0 ? [{ value: inProgress, color: '#f59e0b' }] : []),
          ...(pending > 0 ? [{ value: pending, color: '#6b7280' }] : []),
        ];

  // Thống kê ngày phép
  const remainingLeaveDays = Math.max(0, totalLeaveDays - usedLeaveDays);
  const leavePercentage = totalLeaveDays > 0 ? Math.min(100, Math.round((usedLeaveDays / totalLeaveDays) * 100)) : 0;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="donut-large" size={18} color="#00e5ff" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Hiệu Suất & Nghỉ Phép</Text>
            <Text style={styles.cardSubtitle}>Tổng quan tiến độ nhiệm vụ & ngày phép</Text>
          </View>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{total} Nhiệm vụ</Text>
        </View>
      </View>

      {/* Donut Chart & Legend Row */}
      <View style={styles.chartSection}>
        {/* Donut Chart */}
        <View style={styles.chartWrapper}>
          <PieChart
            donut
            data={pieData}
            radius={screenWidth < 380 ? 46 : 52}
            innerRadius={screenWidth < 380 ? 32 : 36}
            innerCircleColor="#151d1e"
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={styles.centerPercentText}>{completedPct}%</Text>
                <Text style={styles.centerSubText}>Đã xong</Text>
              </View>
            )}
          />
        </View>

        {/* Legend */}
        <View style={styles.legendWrapper}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#05e777' }]} />
            <Text style={styles.legendLabel}>Đã xong:</Text>
            <Text style={[styles.legendVal, { color: '#05e777' }]}>
              {completed} ({completedPct}%)
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.legendLabel}>Đang làm:</Text>
            <Text style={[styles.legendVal, { color: '#f59e0b' }]}>
              {inProgress} ({inProgressPct}%)
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#6b7280' }]} />
            <Text style={styles.legendLabel}>Chưa làm:</Text>
            <Text style={[styles.legendVal, { color: '#9ca3af' }]}>
              {pending} ({pendingPct}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Annual Leave Statistics Section */}
      <View style={styles.leaveSection}>
        <View style={styles.leaveHeaderRow}>
          <View style={styles.leaveTitleRow}>
            <MaterialIcons name="beach-access" size={16} color="#00e5ff" />
            <Text style={styles.leaveTitle}>Phép năm {new Date().getFullYear()}</Text>
          </View>
          <Text style={styles.leaveCountHighlight}>
            Đã sử dụng <Text style={{ color: '#00e5ff', fontWeight: '800' }}>{usedLeaveDays}</Text> / {totalLeaveDays} ngày
          </Text>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${leavePercentage}%` }]} />
        </View>

        <View style={styles.leaveFooterRow}>
          <Text style={styles.leaveFooterNote}>
            ✓ Còn lại <Text style={{ color: '#7dffa2', fontWeight: '700' }}>{remainingLeaveDays} ngày</Text> khả dụng
          </Text>
          <Text style={styles.leaveUsagePercent}>{leavePercentage}% đã dùng</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#151d1e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.35)',
    marginBottom: 14,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dce4e5',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#849396',
    marginTop: 1,
  },
  badge: {
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
  },
  badgeText: {
    fontSize: 10,
    color: '#00e5ff',
    fontWeight: '700',
  },
  chartSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerPercentText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#05e777',
  },
  centerSubText: {
    fontSize: 9,
    color: '#849396',
    marginTop: -2,
  },
  legendWrapper: {
    flex: 1,
    marginLeft: 20,
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendLabel: {
    fontSize: 12,
    color: '#849396',
    flex: 1,
  },
  legendVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(59, 73, 76, 0.3)',
    marginVertical: 14,
  },
  leaveSection: {
    gap: 8,
  },
  leaveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leaveTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dce4e5',
  },
  leaveCountHighlight: {
    fontSize: 11,
    color: '#849396',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#1f2937',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#00e5ff',
    borderRadius: 6,
  },
  leaveFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leaveFooterNote: {
    fontSize: 11,
    color: '#849396',
  },
  leaveUsagePercent: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00e5ff',
  },
});
