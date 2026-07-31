import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { REQUEST_TYPES, RequestTypeItem } from '@/constants/requestTypes';

interface CreateRequestModalProps {
  visible: boolean;
  onClose: () => void;
  selectedType?: RequestTypeItem;
  onSelectType?: (type: RequestTypeItem) => void;
  applyDate?: string;
  onApplyDateChange?: (date: string) => void;
  reason?: string;
  onReasonChange?: (reason: string) => void;
  attachedFile?: string | null;
  onAttachFile?: () => void;
  onSubmit?: (data?: any) => void;
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

  // Local fallback state if props are not controlled
  const [localType, setLocalType] = useState<RequestTypeItem>(selectedType || REQUEST_TYPES[0]);
  const [localDate, setLocalDate] = useState<string>(applyDate || '');
  const [localReason, setLocalReason] = useState<string>(reason || '');

  useEffect(() => {
    if (selectedType) setLocalType(selectedType);
  }, [selectedType]);

  useEffect(() => {
    if (applyDate !== undefined) setLocalDate(applyDate);
  }, [applyDate]);

  useEffect(() => {
    if (reason !== undefined) setLocalReason(reason);
  }, [reason]);

  const currentType = selectedType || localType;
  const currentDate = applyDate !== undefined ? applyDate : localDate;
  const currentReason = reason !== undefined ? reason : localReason;

  const handleSelectType = (typeItem: RequestTypeItem) => {
    setLocalType(typeItem);
    if (onSelectType) onSelectType(typeItem);
  };

  const handleDateChange = (val: string) => {
    setLocalDate(val);
    if (onApplyDateChange) onApplyDateChange(val);
  };

  const handleReasonChange = (val: string) => {
    setLocalReason(val);
    if (onReasonChange) onReasonChange(val);
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        type: currentType,
        date: currentDate,
        reason: currentReason,
        attachedFile,
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        {/* Backdrop bấm ra ngoài để đóng */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* Modal Container dính sát đáy màn hình */}
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          {/* Thanh gạt nhỏ ở đỉnh modal */}
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Tạo đơn từ</Text>
              <Text style={styles.headerSubtitle}>
                Điền thông tin và gửi đơn để quản lý duyệt
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Content cuộn */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Loại đơn */}
            <Text style={styles.label}>Loại đơn</Text>
            <View style={styles.typeRow}>
              {REQUEST_TYPES.map((t) => {
                const isSel = currentType.id === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => handleSelectType(t)}
                    activeOpacity={0.8}
                    style={[styles.typeChip, isSel && styles.typeChipSelected]}
                  >
                    <MaterialIcons
                      name={t.icon as any}
                      size={16}
                      color={isSel ? '#22D3EE' : '#9CA3AF'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.typeChipText,
                        isSel && styles.typeChipTextSelected,
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 2. Ngày áp dụng */}
            <Text style={styles.label}>Ngày áp dụng</Text>
            <View style={styles.inputBox}>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#6B7280"
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={currentDate}
                onChangeText={handleDateChange}
                placeholder="VD: 19/07/2026 hoặc 19-20/07/2026"
                placeholderTextColor="#4B5563"
                style={styles.textInput}
              />
            </View>

            {/* 3. Lý do */}
            <Text style={styles.label}>Lý do</Text>
            <View style={styles.textAreaBox}>
              <TextInput
                value={currentReason}
                onChangeText={handleReasonChange}
                placeholder="Mô tả chi tiết lý do gửi đơn..."
                placeholderTextColor="#4B5563"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={styles.textAreaInput}
              />
            </View>

            {/* 4. Tệp đính kèm */}
            <Text style={styles.label}>Tệp đính kèm (tuỳ chọn)</Text>
            <TouchableOpacity
              onPress={onAttachFile}
              activeOpacity={0.8}
              style={[
                styles.uploadBox,
                attachedFile ? styles.uploadBoxAttached : null,
              ]}
            >
              {attachedFile ? (
                <>
                  <Ionicons name="checkmark-circle" size={22} color="#10B981" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachedFileName}>{attachedFile}</Text>
                    <Text style={styles.uploadSub}>Nhấn để chọn tệp khác hoặc xoá</Text>
                  </View>
                </>
              ) : (
                <>
                  <Ionicons name="attach-outline" size={22} color="#06B6D4" style={{ marginRight: 10 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.uploadTitle}>Tải tệp minh chứng lên</Text>
                    <Text style={styles.uploadSub}>PDF, PNG, JPG — tối đa 15MB</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>

          {/* 5. Cụm nút Action cố định ở đáy (Fix dứt điểm bị hở chân) */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              activeOpacity={0.85}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>Gửi đơn từ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#111827',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
    width: '100%',
    borderTopWidth: 1,
    borderColor: '#1F2937',
  },
  dragHandleWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#4B5563',
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 4,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
    backgroundColor: 'rgba(31, 41, 55, 0.5)',
  },
  typeChipSelected: {
    borderColor: '#22D3EE',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
  },
  typeChipText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  typeChipTextSelected: {
    color: '#22D3EE',
    fontWeight: '700',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  textAreaBox: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    minHeight: 90,
  },
  textAreaInput: {
    color: '#FFFFFF',
    fontSize: 14,
    padding: 0,
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#374151',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  uploadBoxAttached: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  uploadTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  attachedFileName: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
  },
  uploadSub: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  actionRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(31, 41, 55, 0.8)',
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#1F2937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#22D3EE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#030712',
    fontSize: 14,
    fontWeight: '700',
  },
});