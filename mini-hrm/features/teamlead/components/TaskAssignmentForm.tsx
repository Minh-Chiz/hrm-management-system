import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTaskSchema, CreateTaskFormData } from '@/schemas/taskSchema';
import { useAssignTaskMutation } from '@/hooks/queries/useTaskQueries';
import { useUsersQuery } from '@/hooks/queries/useUserQueries';
import { ControlledInput } from '@/components/ui/ControlledInput';

interface TaskAssignmentFormProps {
  onSuccess?: () => void;
}

export function TaskAssignmentForm({ onSuccess }: TaskAssignmentFormProps) {
  const { data: employees = [] } = useUsersQuery();
  const assignTaskMutation = useAssignTaskMutation();
  const [selectedSupporters, setSelectedSupporters] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      assigneeId: employees[0]?.id || '1',
      deadline: 'Hôm nay',
      budget: '',
      pipelineStage: 'development',
    },
  });

  const onSubmit = (data: CreateTaskFormData) => {
    const payload = {
      title: data.title,
      assigneeId: data.assigneeId,
      supporters: selectedSupporters,
      deadline: data.deadline,
      pipelineStage: data.pipelineStage || 'development',
      budget: data.budget ? `${data.budget} VNĐ` : undefined,
    };

    assignTaskMutation.mutate(
      { payload, employees },
      {
        onSuccess: () => {
          Alert.alert('Thành công', 'Đã giao công việc mới cho nhân viên!');
          reset();
          setSelectedSupporters([]);
          if (onSuccess) onSuccess();
        },
        onError: (err: any) => {
          Alert.alert('Lỗi', err.message || 'Không thể giao việc');
        },
      }
    );
  };

  const toggleSupporter = (id: string) => {
    setSelectedSupporters((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
      <ControlledInput
        name="title"
        control={control}
        label="TÊN CÔNG VIỆC *"
        placeholder="Ví dụ: Thiết kế Banner release v2.0"
        icon="assignment"
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>NGƯỜI THỰC HIỆN *</Text>
        <Controller
          control={control}
          name="assigneeId"
          render={({ field: { onChange, value } }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberList}>
              {employees.map((emp) => {
                const isSelected = value === emp.id;
                return (
                  <TouchableOpacity key={emp.id} style={[styles.memberChip, isSelected && styles.memberChipSelected]} onPress={() => onChange(emp.id)}>
                    <Text style={[styles.memberChipText, isSelected && styles.memberChipTextSelected]}>{emp.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        />
        {errors.assigneeId && <Text style={styles.errorText}>{errors.assigneeId.message}</Text>}
      </View>

      <ControlledInput
        name="deadline"
        control={control}
        label="HẠN HOÀN THÀNH *"
        placeholder="Ví dụ: Hôm nay, 18/07/2026"
        icon="event"
      />

      <ControlledInput
        name="budget"
        control={control}
        label="NGÂN SÁCH (TÙY CHỌN)"
        placeholder="Ví dụ: 5.000.000"
        icon="attach-money"
        keyboardType="numeric"
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>GIAI ĐOẠN (PIPELINE STAGE)</Text>
        <Controller
          control={control}
          name="pipelineStage"
          render={({ field: { onChange, value } }) => (
            <View style={styles.stageRow}>
              {[
                { id: 'design', label: '🎨 Design' },
                { id: 'development', label: '💻 Dev' },
                { id: 'testing', label: '🧪 Test' },
              ].map((stg) => (
                <TouchableOpacity key={stg.id} style={[styles.stageChip, value === stg.id && styles.stageChipSelected]} onPress={() => onChange(stg.id as any)}>
                  <Text style={[styles.stageChipText, value === stg.id && styles.stageChipTextSelected]}>{stg.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>NGƯỜI HỖ TRỢ (SUPPORTERS)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.memberList}>
          {employees.map((emp) => {
            const isSelected = selectedSupporters.includes(emp.id);
            return (
              <TouchableOpacity key={emp.id} style={[styles.supporterChip, isSelected && styles.supporterChipSelected]} onPress={() => toggleSupporter(emp.id)}>
                <Text style={[styles.supporterChipText, isSelected && styles.supporterChipTextSelected]}>{emp.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)} disabled={isSubmitting} activeOpacity={0.8}>
        <MaterialIcons name="send" size={18} color="#00363d" />
        <Text style={styles.submitBtnText}>{isSubmitting ? 'Đang gửi...' : 'XÁC NHẬN GIAO VIỆC'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  formContainer: { gap: 14, paddingVertical: 10 },
  fieldGroup: { gap: 6, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '700', color: '#849396', letterSpacing: 0.5 },
  input: { backgroundColor: '#161f21', borderRadius: 8, paddingHorizontal: 12, height: 42, color: '#dce4e5', fontSize: 13, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  errorText: { color: '#ffb4ab', fontSize: 11, marginTop: 2 },
  memberList: { gap: 8, paddingVertical: 4 },
  memberChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#161f21', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  memberChipSelected: { backgroundColor: '#00daf3', borderColor: '#00daf3' },
  memberChipText: { fontSize: 12, color: '#849396' },
  memberChipTextSelected: { color: '#00363d', fontWeight: '700' },
  stageRow: { flexDirection: 'row', gap: 8 },
  stageChip: { flex: 1, height: 36, borderRadius: 8, backgroundColor: '#161f21', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  stageChipSelected: { backgroundColor: 'rgba(0, 218, 243, 0.2)', borderColor: '#00daf3' },
  stageChipText: { fontSize: 11, color: '#849396' },
  stageChipTextSelected: { color: '#00daf3', fontWeight: '700' },
  supporterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#161f21' },
  supporterChipSelected: { backgroundColor: '#7dffa2' },
  supporterChipText: { fontSize: 11, color: '#849396' },
  supporterChipTextSelected: { color: '#00363d', fontWeight: '700' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 46, borderRadius: 10, backgroundColor: '#00daf3', marginTop: 10 },
  submitBtnText: { fontSize: 13, fontWeight: '800', color: '#00363d' },
});
