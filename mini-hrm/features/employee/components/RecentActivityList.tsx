import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { RecentActivityListProps } from '../types/dashboard';

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nhật ký hoạt động gần đây</Text>
      {activities.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="history" size={28} color="#849396" />
          <Text style={styles.emptyText}>Chưa có hoạt động nào gần đây</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {activities.map((item, index) => (
            <View key={item.id} style={styles.activityRow}>
              <View style={styles.timelineCol}>
                <View style={[styles.iconWrap, { backgroundColor: `${item.statusColor || '#00e5ff'}20` }]}>
                  <MaterialIcons
                    name={item.iconName as keyof typeof MaterialIcons.glyphMap}
                    size={16}
                    color={item.statusColor || '#00e5ff'}
                  />
                </View>
                {index < activities.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.contentCol}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemTime}>{item.timestamp}</Text>
                </View>
                <Text style={styles.itemDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '700', color: '#dce4e5', marginBottom: 12 },
  emptyState: { paddingVertical: 20, alignItems: 'center', backgroundColor: '#192122', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  emptyText: { color: '#849396', fontSize: 12, marginTop: 6 },
  timeline: { gap: 0 },
  activityRow: { flexDirection: 'row', gap: 12, minHeight: 48 },
  timelineCol: { alignItems: 'center', width: 28 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  timelineLine: { flex: 1, width: 2, backgroundColor: 'rgba(59,73,76,0.3)', marginVertical: 4 },
  contentCol: { flex: 1, backgroundColor: '#192122', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(59,73,76,0.2)' },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  itemTitle: { fontSize: 13, fontWeight: '700', color: '#dce4e5' },
  itemTime: { fontSize: 10, color: '#849396' },
  itemDesc: { fontSize: 11, color: '#bac9cc' },
});
