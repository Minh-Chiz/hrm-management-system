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

  // Màu sắc theo hiệu suất
  const getColor = (rate: number) =>
    rate === 100 ? '#05e777' : rate >= 90 ? '#00daf3' : '#f59e0b';

  // Chuẩn bị dữ liệu cho BarChart — KHÔNG dùng topLabelComponent
  const barData = sourceData.map((item) => ({
    value: item.rate,
    label: item.day,
    frontColor: getColor(item.rate),
  }));

  // Tính toán kích thước co giãn theo màn hình
  const availableWidth = Math.max(260, screenWidth - 72);
  const barWidth = screenWidth < 380 ? 22 : 28;
  const spacing = Math.max(16, Math.floor((availableWidth - barWidth * 5 - 45) / 5));

  // gifted-charts: yAxisLabelWidth mặc định ~35px, initialSpacing = spacing/2
  const YAXIS_W = 35;
  const initialSpacing = Math.floor(spacing / 2);
  const CHART_HEIGHT = 150;
  const MAX_VALUE = 100;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="bar-chart" size={18} color="#00daf3" />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.cardTitle} numberOfLines={1}>Tỷ Lệ Chuyên Cần 5 Ngày Gần Nhất</Text>
          <Text style={styles.cardSubtitle} numberOfLines={1}>Thống kê tuần làm việc (Thứ 2 - Thứ 6)</Text>
        </View>
        <View style={styles.avgBadge}>
          <Text style={styles.avgBadgeLabel}>TB:</Text>
          <Text style={styles.avgBadgeValue}>{avgRate}%</Text>
        </View>
      </View>

      {/* Nhãn số % — render NGOÀI chart, không bao giờ bị clip */}
      <View style={styles.labelsRow}>
        {/* khoảng trống tương đương phần trục Y */}
        <View style={{ width: YAXIS_W + initialSpacing }} />
        {sourceData.map((item, i) => {
          const color = getColor(item.rate);
          return (
            <View key={i} style={styles.labelItem}>
              <Text style={[styles.labelText, { color }]} numberOfLines={1}>
                {item.rate}%
              </Text>
            </View>
          );
        })}
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
          maxValue={MAX_VALUE}
          height={CHART_HEIGHT}
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
    gap: 10,
    marginBottom: 12,
  },
  headerCenter: {
    flex: 1,
    flexShrink: 1,
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
  /* Nhãn số % thủ công */
  labelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labelItem: {
    flex: 1,
    alignItems: 'center',
  },
  labelText: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -2,
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
