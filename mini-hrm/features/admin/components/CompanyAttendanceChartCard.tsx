import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';

interface CompanyAttendanceChartCardProps {
  // Có thể truyền dữ liệu tùy biến hoặc dùng dữ liệu tuần mặc định
  data?: Array<{ day: string; rate: number; count: number; total: number }>;
}

export const CompanyAttendanceChartCard: React.FC<CompanyAttendanceChartCardProps> = ({
  data,
}) => {
  const { width: screenWidth } = useWindowDimensions();

  // Dữ liệu 5 ngày làm việc gần nhất (T2 đến T6)
  const defaultAttendance = [
    { day: 'T2', rate: 92, count: 18, total: 20 },
    { day: 'T3', rate: 96, count: 19, total: 20 },
    { day: 'T4', rate: 88, count: 17, total: 20 },
    { day: 'T5', rate: 100, count: 20, total: 20 },
    { day: 'T6', rate: 95, count: 19, total: 20 },
  ];

  const sourceData = data && data.length > 0 ? data : defaultAttendance;

  // Tính trung bình tuần
  const avgRate = Math.round(sourceData.reduce((acc, curr) => acc + curr.rate, 0) / sourceData.length);
  const highestDay = [...sourceData].sort((a, b) => b.rate - a.rate)[0];

  // Chuẩn bị dữ liệu cho react-native-gifted-charts BarChart
  const barData = sourceData.map((item) => {
    // Màu sắc theo hiệu suất: 100% -> #05e777 (Xanh lá), >=92% -> #00daf3 (Cyan), <90% -> #f59e0b (Vàng cam)
    const color = item.rate === 100 ? '#05e777' : item.rate >= 90 ? '#00daf3' : '#f59e0b';

    return {
      value: item.rate,
      label: item.day,
      frontColor: color,
      topLabelComponent: () => (
        <Text style={[styles.topLabelText, { color }]}>{item.rate}%</Text>
      ),
    };
  });

  // Tính toán kích thước co giãn theo màn hình
  // Chiều rộng khả dụng = screenWidth - padding 2 bên (32) - card padding (32)
  const availableWidth = Math.max(260, screenWidth - 72);
  const barWidth = screenWidth < 380 ? 22 : 28;
  const spacing = Math.max(16, Math.floor((availableWidth - barWidth * 5 - 45) / 5));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="bar-chart" size={18} color="#00daf3" />
          </View>
          <View>
            <Text style={styles.cardTitle}>Tỷ Lệ Chuyên Cần 5 Ngày Gần Nhất</Text>
            <Text style={styles.cardSubtitle}>Thống kê tuần làm việc (Thứ 2 - Thứ 6)</Text>
          </View>
        </View>

        <View style={styles.avgBadge}>
          <Text style={styles.avgBadgeLabel}>Trung bình:</Text>
          <Text style={styles.avgBadgeValue}>{avgRate}%</Text>
        </View>
      </View>

      {/* Bar Chart Container */}
      <View style={styles.chartWrapper}>
        <BarChart
          data={barData}
          barWidth={barWidth}
          spacing={spacing}
          roundedTop
          roundedBottom={false}
          hideRules={false}
          rulesColor="rgba(59, 73, 76, 0.25)"
          rulesType="dashed"
          xAxisColor="rgba(59, 73, 76, 0.4)"
          yAxisColor="rgba(59, 73, 76, 0.4)"
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisLabelText}
          noOfSections={4}
          maxValue={100}
          height={135}
          width={availableWidth - 10}
          isAnimated
          animationDuration={600}
        />
      </View>

      {/* Summary Footer */}
      <View style={styles.footerRow}>
        <View style={styles.footerItem}>
          <View style={[styles.footerDot, { backgroundColor: '#05e777' }]} />
          <Text style={styles.footerText}>
            Cao nhất: <Text style={{ color: '#05e777', fontWeight: '700' }}>{highestDay.day} ({highestDay.rate}%)</Text>
          </Text>
        </View>

        <View style={styles.footerItem}>
          <View style={[styles.footerDot, { backgroundColor: '#00daf3' }]} />
          <Text style={styles.footerText}>
            Đạt mục tiêu: <Text style={{ color: '#00daf3', fontWeight: '700' }}>&gt;90%</Text>
          </Text>
        </View>

        <View style={styles.footerItem}>
          <View style={[styles.footerDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.footerText}>
            Vắng TB: <Text style={{ color: '#f59e0b', fontWeight: '700' }}>1.2/ngày</Text>
          </Text>
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
    marginBottom: 16,
    shadowColor: '#00daf3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 218, 243, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.25)',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dce4e5',
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#849396',
    marginTop: 1,
  },
  avgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 218, 243, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 218, 243, 0.3)',
  },
  avgBadgeLabel: {
    fontSize: 10,
    color: '#849396',
  },
  avgBadgeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00daf3',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    overflow: 'hidden',
  },
  topLabelText: {
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  axisText: {
    color: '#849396',
    fontSize: 10,
  },
  axisLabelText: {
    color: '#dce4e5',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.25)',
    paddingTop: 12,
    marginTop: 8,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  footerText: {
    fontSize: 10,
    color: '#849396',
  },
});
