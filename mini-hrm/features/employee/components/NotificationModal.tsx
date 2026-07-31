import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppNotification } from '@/types';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  visible,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => {}}>
          <View style={styles.dragHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Thông báo</Text>
              <Text style={styles.modalSubtitle}>
                {unreadCount > 0 ? `${unreadCount} chưa đọc / ${notifications.length} tổng cộng` : `${notifications.length} thông báo`}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {unreadCount > 0 && (
                <TouchableOpacity onPress={onMarkAllAsRead} activeOpacity={0.7}>
                  <Text style={{ fontSize: 12, color: '#00e5ff', fontWeight: '600' }}>Đọc tất cả</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
                <MaterialIcons name="close" size={20} color="#849396" />
              </TouchableOpacity>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {notifications.length === 0 ? (
              <View style={{ paddingVertical: 36, alignItems: 'center' }}>
                <MaterialIcons name="notifications-none" size={40} color="#3b494c" />
                <Text style={{ color: '#849396', fontSize: 14, marginTop: 10 }}>Chưa có thông báo nào</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {notifications.map((n) => (
                  <TouchableOpacity
                    key={n.id}
                    style={[
                      styles.notiItem,
                      !n.read && { backgroundColor: 'rgba(0, 229, 255, 0.05)', borderColor: 'rgba(0, 229, 255, 0.25)', borderWidth: 1 },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => onMarkAsRead(n.id)}
                  >
                    <View style={[styles.notiIconWrap, { backgroundColor: `${n.iconColor || '#00e5ff'}18` }]}>
                      <MaterialIcons name={(n.icon as any) || 'notifications'} size={20} color={n.iconColor || '#00e5ff'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.notiTitle}>{n.title}</Text>
                        {!n.read && <View style={styles.unreadDot} />}
                      </View>
                      <Text style={styles.notiMessage}>{n.message}</Text>
                      <Text style={styles.notiTime}>{n.time}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={{ height: 24 }} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#151d1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '80%' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3b494c', alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#dce4e5' },
  modalSubtitle: { fontSize: 12, color: '#849396', marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#192122', alignItems: 'center', justifyContent: 'center' },
  notiItem: { flexDirection: 'row', gap: 12, backgroundColor: '#192122', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  notiIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  notiTitle: { fontSize: 13, fontWeight: '700', color: '#dce4e5' },
  notiMessage: { fontSize: 11, color: '#bac9cc', marginTop: 2 },
  notiTime: { fontSize: 10, color: '#849396', marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00e5ff' },
});
