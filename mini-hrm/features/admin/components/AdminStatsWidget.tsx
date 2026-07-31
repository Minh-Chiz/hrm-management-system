import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface AdminStatsWidgetProps {
  onlineCount: number;
  totalEmployees: number;
  pendingRequestsCount: number;
  todayLeavesCount: number;
  onNavigateTab: (tab: 'overview' | 'employees' | 'tasks' | 'approval') => void;
}

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

export function AdminStatsWidget({
  onlineCount,
  totalEmployees,
  pendingRequestsCount,
  todayLeavesCount,
  onNavigateTab,
}: AdminStatsWidgetProps) {
  return (
    <View style={styles.bentoGrid}>
      {/* Online employees Card */}
      <ScalePress
        onPress={() => onNavigateTab('employees')}
        style={[styles.glassCard, styles.bentoLarge, { borderLeftColor: '#62ff96' }]}
      >
        <View style={styles.bentoLargeContent}>
          <View>
            <Text style={styles.bentoLargeLabel}>NHÂN VIÊN ONLINE</Text>
            <View style={styles.bentoLargeValueRow}>
              <Text style={styles.bentoLargeValue}>{onlineCount}</Text>
              <Text style={styles.bentoLargeSubValue}>/{totalEmployees}</Text>
            </View>
            <View style={styles.cardNavHint}>
              <Text style={styles.cardNavHintText}>Quản lý nhân sự</Text>
              <MaterialIcons name="chevron-right" size={12} color="#849396" />
            </View>
          </View>
          <View style={[styles.bentoIconWrapper, { backgroundColor: '#62ff9618' }]}>
            <MaterialIcons name="groups" size={26} color="#62ff96" />
            <View style={[styles.pulseDot, { backgroundColor: '#62ff96' }]} />
          </View>
        </View>
      </ScalePress>

      {/* Small cards row */}
      <View style={styles.bentoSmallRow}>
        {/* Pending requests card */}
        <ScalePress
          onPress={() => onNavigateTab('approval')}
          style={[styles.glassCard, styles.bentoSmall, { borderLeftColor: '#e9c400' }]}
        >
          <View style={styles.bentoSmallTop}>
            <View style={[styles.bentoSmallIcon, { backgroundColor: '#e9c40018' }]}>
              <MaterialIcons name="warning" size={16} color="#e9c400" />
            </View>
            <Text style={[styles.bentoSmallValue, { color: '#e9c400' }]}>
              {pendingRequestsCount}
            </Text>
          </View>
          <Text style={styles.bentoSmallLabel}>Đơn cần duyệt</Text>
          <View style={styles.cardNavHint}>
            <Text style={styles.cardNavHintText}>Xem & duyệt</Text>
            <MaterialIcons name="chevron-right" size={11} color="#849396" />
          </View>
        </ScalePress>

        {/* Today leaves card */}
        <ScalePress
          onPress={() => onNavigateTab('approval')}
          style={[styles.glassCard, styles.bentoSmall, { borderLeftColor: '#ffb4ab' }]}
        >
          <View style={styles.bentoSmallTop}>
            <View style={[styles.bentoSmallIcon, { backgroundColor: '#ffb4ab18' }]}>
              <MaterialIcons name="calendar-today" size={16} color="#ffb4ab" />
            </View>
            <Text style={[styles.bentoSmallValue, { color: '#ffb4ab' }]}>
              {todayLeavesCount}
            </Text>
          </View>
          <Text style={styles.bentoSmallLabel}>Nghỉ phép hôm nay</Text>
          <View style={styles.cardNavHint}>
            <Text style={styles.cardNavHintText}>Xem đơn</Text>
            <MaterialIcons name="chevron-right" size={11} color="#849396" />
          </View>
        </ScalePress>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  bentoLarge: { padding: 16 },
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
  cardNavHint: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 6 },
  cardNavHintText: { fontSize: 10, color: '#849396', fontWeight: '500', letterSpacing: 0.2 },
});
