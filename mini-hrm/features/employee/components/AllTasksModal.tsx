import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Task } from '@/types';

interface AllTasksModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: Task[];
  onSelectTask: (task: Task) => void;
}

export const AllTasksModal: React.FC<AllTasksModalProps> = ({
  visible,
  onClose,
  tasks,
  onSelectTask,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => {}}>
          <View style={styles.dragHandle} />
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Tất cả công việc</Text>
              <Text style={styles.modalSubtitle}>{tasks.length} công việc được giao cho bạn</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color="#849396" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {tasks.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <MaterialIcons name="assignment-late" size={40} color="#3b494c" />
                <Text style={{ color: '#849396', fontSize: 14, marginTop: 10 }}>Bạn chưa có công việc nào được giao</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {tasks.map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskCard}
                    activeOpacity={0.75}
                    onPress={() => {
                      onClose();
                      setTimeout(() => onSelectTask(task), 200);
                    }}
                  >
                    <View style={styles.taskCardTop}>
                      <Text style={styles.taskTitle}>{task.title}</Text>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>{task.status}</Text>
                      </View>
                    </View>
                    <View style={styles.taskMeta}>
                      <MaterialIcons name="event" size={13} color="#849396" />
                      <Text style={styles.taskMetaText}>Hạn chót: {task.deadline}</Text>
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
  modalSheet: { backgroundColor: '#151d1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '88%' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3b494c', alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#dce4e5' },
  modalSubtitle: { fontSize: 12, color: '#849396', marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#192122', alignItems: 'center', justifyContent: 'center' },
  taskCard: { backgroundColor: '#192122', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', borderLeftWidth: 4, borderLeftColor: '#00e5ff' },
  taskCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskTitle: { fontSize: 14, fontWeight: '700', color: '#dce4e5', flex: 1, marginRight: 8 },
  statusPill: { backgroundColor: 'rgba(0,229,255,0.12)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusPillText: { fontSize: 10, fontWeight: '700', color: '#00e5ff' },
  taskMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  taskMetaText: { fontSize: 11, color: '#849396' },
});
