import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRequestSchema, CreateRequestFormData } from '@/schemas/requestSchema';
import { REQUEST_TYPES, RequestTypeItem } from '@/constants/requestTypes';
import { ControlledInput } from '@/components/ui/ControlledInput';

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

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateRequestFormData>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      type: (selectedType?.label as any) || 'Nghỉ phép',
      date: applyDate || '',
      reason: reason || '',
      description: reason || 'Gửi đơn xin phê duyệt',
      hasAttachment: Boolean(attachedFile),
      attachmentName: attachedFile || undefined,
    },
  });

  useEffect(() => {
    if (visible) {
      reset({
        type: (selectedType?.label as any) || 'Nghỉ phép',
        date: applyDate || '',
        reason: reason || '',
        description: reason || 'Gửi đơn xin phê duyệt',
        hasAttachment: Boolean(attachedFile),
        attachmentName: attachedFile || undefined,
      });
    }
  }, [visible, selectedType, applyDate, reason, attachedFile, reset]);

  const onValidSubmit = (data: CreateRequestFormData) => {
    const selectedTypeObj =
      REQUEST_TYPES.find((t) => t.label === data.type) || REQUEST_TYPES[0];

    if (onSelectType) onSelectType(selectedTypeObj);
    if (onApplyDateChange) onApplyDateChange(data.date);
    if (onReasonChange) onReasonChange(data.reason);

    if (onSubmit) {
      onSubmit({
        ...data,
        type: selectedTypeObj,
        attachedFile: attachedFile || data.attachmentName,
      });
    }
    onClose();
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
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.dragHandleWrap}>
            <View style={styles.dragHandle} />
          </View>

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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* 1. Loại đơn */}
            <Text style={styles.label}>Loại đơn *</Text>
            <Controller
              control={control}
              name="type"
              render={({ field: { onChange, value } }) => (
                <View style={styles.typeRow}>
                  {REQUEST_TYPES.map((t) => {
                    const isSel = value === t.label;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => {
                          onChange(t.label as any);
                          if (onSelectType) onSelectType(t);
                        }}
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
              )}
            />
            {errors.type && <Text style={styles.errorText}>{errors.type.message}</Text>}

            {/* 2. Ngày áp dụng */}
            <ControlledInput
              name="date"
              control={control}
              label="NGÀY ÁP DỤNG *"
              placeholder="VD: 19/07/2026 hoặc 19-20/07/2026"
              icon="event"
            />

            {/* 3. Mô tả */}
            <ControlledInput
              name="description"
              control={control}
              label="MÔ TẢ NGẮN *"
              placeholder="Nhập tiêu đề hoặc mô tả đơn từ..."
              icon="description"
            />

            {/* 4. Lý do */}
            <ControlledInput
              name="reason"
              control={control}
              label="LÝ DO CHI TIẾT *"
              placeholder="Mô tả chi tiết lý do gửi đơn..."
              icon="edit"
            />

            {/* 5. Tệp đính kèm */}
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

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit(onValidSubmit)}
              disabled={isSubmitting}
              activeOpacity={0.85}
              style={styles.submitBtn}
            >
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Đang gửi...' : 'Gửi đơn từ'}
              </Text>
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
  errorText: {
    color: '#ff4d4f',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
    fontWeight: '500',
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
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#374151',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
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