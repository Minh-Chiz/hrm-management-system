import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REQUEST_TYPES } from '@/constants/requestTypes';

interface CreateRequestModalProps {
  visible: boolean;
  onClose: () => void;
  selectedType: typeof REQUEST_TYPES[0];
  onSelectType: (type: typeof REQUEST_TYPES[0]) => void;
  applyDate: string;
  onApplyDateChange: (date: string) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  attachedFile: string | null;
  onAttachFile: () => void;
  onSubmit: () => void;
}

export const CreateRequestModal: React.FC<CreateRequestModalProps> = ({
  visible,
  onClose,
  selectedType,
  onSelectType,
  applyDate,
  onApplyDateChange,
  reason,
  onReasonChange,
  attachedFile,
  onAttachFile,
  onSubmit,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboardView}>
          <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <View style={styles.dragHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Tạo đơn từ</Text>
                <Text style={styles.modalSubtitle}>Điền thông tin và gửi đơn để quản lý duyệt</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose} activeOpacity={0.7}>
                <MaterialIcons name="close" size={20} color="#849396" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: Math.max(insets.bottom + 40, 50) }}>
              <Text style={styles.formLabel}>Loại đơn</Text>
              <View style={styles.typeRow}>
                {REQUEST_TYPES.map((t) => {
                  const isSel = selectedType.id === t.id;
                  return (
                    <TouchableOpacity key={t.id} style={[styles.typeChip, isSel && styles.typeChipSelected]} onPress={() => onSelectType(t)}>
                      <MaterialIcons name={t.icon as any} size={14} color={isSel ? '#0d1516' : '#849396'} />
                      <Text style={[styles.typeChipText, isSel && styles.typeChipTextSelected]}>{t.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.formLabel}>Ngày áp dụng</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="event" size={16} color="#849396" style={{ marginRight: 8 }} />
                <TextInput style={styles.textInput} placeholder="VD: 19/07/2026 hoặc 19-20/07/2026" placeholderTextColor="#3b494c" value={applyDate} onChangeText={onApplyDateChange} />
              </View>

              <Text style={styles.formLabel}>Lý do</Text>
              <TextInput style={styles.textArea} placeholder="Mô tả chi tiết lý do gửi đơn..." placeholderTextColor="#3b494c" value={reason} onChangeText={onReasonChange} multiline numberOfLines={4} textAlignVertical="top" />

              <Text style={styles.formLabel}>Tệp đính kèm (tuỳ chọn)</Text>
              <TouchableOpacity style={[styles.uploadZone, attachedFile ? styles.uploadZoneAttached : null]} onPress={onAttachFile}>
                {attachedFile ? (
                  <>
                    <MaterialIcons name="check-circle" size={22} color="#05e777" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.uploadAttachedName}>{attachedFile}</Text>
                      <Text style={styles.uploadHint}>Nhấn để xoá tệp</Text>
                    </View>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="attach-file" size={22} color="#00daf3" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.uploadTitle}>Tải tệp minh chứng lên</Text>
                      <Text style={styles.uploadHint}>PDF, PNG, JPG — tối đa 15MB</Text>
                    </View>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} activeOpacity={0.85}>
                <MaterialIcons name="send" size={16} color="#003918" />
                <Text style={styles.submitBtnText}>XÁC NHẬN GỬI</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  keyboardView: { width: '100%' },
  modalSheet: { backgroundColor: '#151d1e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, maxHeight: '85%' },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#3b494c', alignSelf: 'center', marginBottom: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#dce4e5' },
  modalSubtitle: { fontSize: 12, color: '#849396', marginTop: 2 },
  modalCloseBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#192122', alignItems: 'center', justifyContent: 'center' },
  formLabel: { fontSize: 12, fontWeight: '700', color: '#bac9cc', marginTop: 4 },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#192122', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  typeChipSelected: { backgroundColor: '#00e5ff', borderColor: '#00e5ff' },
  typeChipText: { fontSize: 12, color: '#849396' },
  typeChipTextSelected: { color: '#0d1516', fontWeight: '700' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#192122', borderRadius: 10, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  textInput: { flex: 1, color: '#dce4e5', fontSize: 13 },
  textArea: { backgroundColor: '#192122', borderRadius: 10, padding: 12, height: 90, color: '#dce4e5', fontSize: 13, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  uploadZone: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#192122', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: 'rgba(59,73,76,0.3)' },
  uploadZoneAttached: { borderColor: '#05e777', backgroundColor: 'rgba(5,231,119,0.05)' },
  uploadAttachedName: { fontSize: 12, color: '#05e777', fontWeight: '700' },
  uploadTitle: { fontSize: 12, color: '#dce4e5', fontWeight: '600' },
  uploadHint: { fontSize: 10, color: '#849396', marginTop: 2 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#05e777', height: 48, borderRadius: 12, marginTop: 10 },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#003918' },
});
