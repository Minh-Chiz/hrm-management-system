import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LeaveRequestWidgetProps } from '../types/dashboard';
import { mapStatusEnum } from '@/utils';

export const LeaveRequestWidget: React.FC<LeaveRequestWidgetProps> = ({
  requests,
  onOpenCreateModal,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử đơn từ ({requests.length})</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={onOpenCreateModal}>
          <Text style={styles.addLink}>+ Tạo đơn mới</Text>
        </TouchableOpacity>
      </View>

      {requests.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="event-note" size={28} color="#00e5ff" style={{ opacity: 0.8 }} />
          <Text style={styles.emptyTitle}>Chưa có đơn từ nào</Text>
          <Text style={styles.emptySubtitle}>
            Các đơn xin nghỉ, làm thêm giờ (OT) hoặc chấm công bù bạn gửi sẽ xuất hiện ở đây.
          </Text>
        </View>
      ) : (
        <View style={styles.requestList}>
          {requests.slice(0, 4).map((req) => {
            const statusInfo = mapStatusEnum(req.status);

            const iconName = req.type.includes('OT')
              ? 'more-time'
              : req.type.includes('Nghỉ')
              ? 'event-busy'
              : 'edit-calendar';

            return (
              <View key={req.id} style={styles.requestCard}>
                <View style={styles.cardTop}>
                  <View style={styles.typeRow}>
                    <View style={styles.iconWrap}>
                      <MaterialIcons name={iconName} size={18} color="#00e5ff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.requestType}>{req.type}</Text>
                      <Text style={styles.requestReason} numberOfLines={1}>
                        {req.reason}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusInfo.bg }]}>
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
                  </View>
                </View>
                <View style={styles.cardBottom}>
                  <MaterialIcons name="event" size={13} color="#849396" />
                  <Text style={styles.requestDate}>Ngày áp dụng: {req.date}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 18, fontWeight: '700', color: '#dce4e5' },
  addLink: { fontSize: 12, color: '#00e5ff', fontWeight: '600' },
  emptyState: { paddingVertical: 24, alignItems: 'center', backgroundColor: '#192122', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', paddingHorizontal: 16 },
  emptyTitle: { color: '#dce4e5', fontSize: 14, fontWeight: '700', marginTop: 8 },
  emptySubtitle: { color: '#849396', fontSize: 12, textAlign: 'center', marginTop: 4 },
  requestList: { gap: 10 },
  requestCard: { backgroundColor: '#192122', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,229,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  requestType: { fontSize: 13, fontWeight: '700', color: '#dce4e5' },
  requestReason: { fontSize: 11, color: '#849396', marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 4, borderTopWidth: 1, borderTopColor: 'rgba(59,73,76,0.2)', paddingTop: 6 },
  requestDate: { fontSize: 11, color: '#849396' },
});
