import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Task } from '@/types';

interface TaskDetailModalProps {
  visible: boolean;
  onClose: () => void;
  task: Task | null;
  showAllStatusOptions: boolean;
  onToggleShowAllStatus: () => void;
  onUpdateStatus: (status: Task['status'], statusType: Task['statusType']) => void;
  onProgressStep: (step: number) => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  visible,
  onClose,
  task,
  showAllStatusOptions,
  onToggleShowAllStatus,
  onUpdateStatus,
  onProgressStep,
}) => {
  const insets = useSafeAreaInsets();

  if (!task) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) }]} onPress={() => {}}>
          <View style={styles.dragHandle} />
          <View style={styles.modalHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.modalTitle} numberOfLines={1}>{task.title}</Text>
              <Text style={styles.modalSubtitle}>Cập nhật trạng thái công việc của bạn</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
              <MaterialIcons name="close" size={20} color="#849396" />
            </TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ paddingBottom: 24, gap: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#bac9cc', fontSize: 13 }}>Hạn chót: {task.deadline}</Text>
                <Text style={{ color: '#00e5ff', fontSize: 13, fontWeight: '700' }}>{task.status}</Text>
              </View>

              <View style={styles.progressCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: '#dce4e5', fontWeight: '700', fontSize: 13 }}>Cập nhật tiến độ (%):</Text>
                  <Text style={{ color: '#00e5ff', fontWeight: '800', fontSize: 15 }}>{task.progress || 0}%</Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${task.progress || 0}%` }]} />
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[0, 25, 50, 75, 100].map((step) => {
                    const isSelected = (task.progress || 0) === step;
                    return (
                      <TouchableOpacity
                        key={step}
                        style={[styles.stepBtn, isSelected && styles.stepBtnSelected]}
                        onPress={() => onProgressStep(step)}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isSelected ? '#00e5ff' : '#849396' }}>
                          {step}%
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {task.status === 'Cần làm' && (
                <TouchableOpacity style={styles.primaryActionBtn} onPress={() => onUpdateStatus('Đang làm', 'warning')}>
                  <MaterialIcons name="play-arrow" size={22} color="#0d1516" />
                  <Text style={styles.primaryActionText}>▶ BẮT ĐẦU THỰC HIỆN</Text>
                </TouchableOpacity>
              )}

              {(task.status === 'Đang làm' || task.status === 'Trễ hạn') && (
                <TouchableOpacity style={styles.submitActionBtn} onPress={() => onUpdateStatus('Chờ review', 'primary')}>
                  <MaterialIcons name="send" size={18} color="#00363d" />
                  <Text style={styles.submitActionText}>📤 GỬI DUYỆT / KIỂM THỬ</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={onToggleShowAllStatus} style={styles.toggleBtn}>
                <Text style={{ color: '#849396', fontSize: 12 }}>
                  {showAllStatusOptions ? 'Ẩn tuỳ chọn thủ công' : 'Chuyển trạng thái khác...'}
                </Text>
                <MaterialIcons name={showAllStatusOptions ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={18} color="#849396" />
              </TouchableOpacity>

              {showAllStatusOptions && (
                <View style={{ gap: 8 }}>
                  {[
                    { status: 'Cần làm', statusType: 'neutral', icon: 'schedule', color: '#849396' },
                    { status: 'Đang làm', statusType: 'warning', icon: 'trending-flat', color: '#f5cd00' },
                    { status: 'Chờ review', statusType: 'primary', icon: 'rate-review', color: '#00e5ff' },
                    { status: 'Hoàn thành', statusType: 'success', icon: 'check-circle', color: '#05e777' },
                  ].map((opt) => (
                    <TouchableOpacity
                      key={opt.status}
                      onPress={() => onUpdateStatus(opt.status as any, opt.statusType as any)}
                      style={styles.optionRow}
                    >
                      <MaterialIcons name={opt.icon as any} size={18} color={opt.color} />
                      <Text style={{ color: '#dce4e5', fontWeight: '600', fontSize: 13, flex: 1, marginLeft: 10 }}>{opt.status}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
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
  progressCard: { backgroundColor: '#192122', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)', gap: 8 },
  progressBarBg: { height: 8, backgroundColor: 'rgba(59,73,76,0.4)', borderRadius: 999, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#00e5ff' },
  stepBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', backgroundColor: '#252525', borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  stepBtnSelected: { backgroundColor: 'rgba(0,229,255,0.2)', borderColor: '#00e5ff' },
  primaryActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#f5cd00', borderRadius: 14, height: 48, marginTop: 6 },
  primaryActionText: { color: '#0d1516', fontWeight: '800', fontSize: 15 },
  submitActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#00e5ff', borderRadius: 14, height: 48, marginTop: 6 },
  submitActionText: { color: '#00363d', fontWeight: '800', fontSize: 15 },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#242b2d', borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
});
