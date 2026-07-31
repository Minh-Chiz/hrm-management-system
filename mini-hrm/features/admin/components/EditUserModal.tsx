import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { AlertBox } from '@/components/ui/AlertBox';
import { Employee } from '@/types';

interface EditUserModalProps {
  visible: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (
    id: string,
    updatedData: { role: 'employee' | 'teamlead'; password?: string; specialization: string; status?: 'Active' | 'Inactive' }
  ) => void;
}

export function EditUserModal({ visible, employee, onClose, onSave }: EditUserModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'employee' | 'teamlead'>('employee');
  const [specialization, setSpecialization] = useState('Frontend');
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setPassword(employee.password || '');
      setRole(employee.role);
      setSpecialization(employee.specialization || 'Frontend');
      setStatus(employee.status || 'Active');
      setErrorMessage(null);
      setShowPassword(false);
    }
  }, [employee, visible]);

  const handleSave = () => {
    setErrorMessage(null);
    if (!employee) return;

    onSave(employee.id, {
      role,
      password: password.trim() || undefined,
      specialization,
      status,
    });
    handleClose();
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />
        <View style={styles.modalSheet}>
          <View style={styles.dragHandle} />
          <Text style={styles.modalTitle}>Chỉnh sửa nhân sự</Text>
          <Text style={styles.modalSubtitle}>Cập nhật thông tin, chức vụ, trạng thái hoặc mật khẩu.</Text>

          {errorMessage && <AlertBox message={errorMessage} />}

          <View style={styles.readOnlyContext}>
            <Text style={styles.readOnlyText}>Họ và tên: <Text style={styles.readOnlyVal}>{employee?.name}</Text></Text>
            <Text style={styles.readOnlyText}>Email: <Text style={styles.readOnlyVal}>{employee?.email}</Text></Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>TRẠNG THÁI</Text>
            <View style={styles.roleRow}>
              {[
                { value: 'Active', label: 'Active', color: '#05e777' },
                { value: 'Inactive', label: 'Inactive', color: '#849396' },
              ].map((opt) => (
                <TouchableOpacity key={opt.value} style={[styles.roleOption, status === opt.value && styles.roleOptionSelected]} onPress={() => setStatus(opt.value as 'Active' | 'Inactive')} activeOpacity={0.75}>
                  <Text style={[styles.roleOptionText, status === opt.value && styles.roleOptionTextSelected]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>ĐỔI MẬT KHẨU</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={16} color="#849396" />
              <TextInput style={styles.inputField} placeholder="Mật khẩu mới (bỏ trống nếu giữ nguyên)" placeholderTextColor="#3b494c" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} activeOpacity={0.7}>
                <MaterialIcons name={showPassword ? 'visibility' : 'visibility-off'} size={16} color="#849396" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>CHỨC VỤ</Text>
            <View style={styles.roleRow}>
              {[
                { value: 'employee', label: 'Nhân viên', icon: 'person' },
                { value: 'teamlead', label: 'Trưởng nhóm', icon: 'supervisor-account' },
              ].map((opt) => (
                <TouchableOpacity key={opt.value} style={[styles.roleOption, role === opt.value && styles.roleOptionSelected]} onPress={() => setRole(opt.value as 'employee' | 'teamlead')} activeOpacity={0.75}>
                  <MaterialIcons name={opt.icon as any} size={16} color={role === opt.value ? '#00363d' : '#849396'} />
                  <Text style={[styles.roleOptionText, role === opt.value && styles.roleOptionTextSelected]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>CHUYÊN NGÀNH</Text>
            <View style={styles.specRow}>
              {['Frontend', 'Backend', 'Mobile', 'Tester', 'UI/UX Design'].map((spec) => (
                <TouchableOpacity key={spec} style={[styles.specOption, specialization === spec && styles.specOptionSelected]} onPress={() => setSpecialization(spec)} activeOpacity={0.75}>
                  <Text style={[styles.specOptionText, specialization === spec && styles.specOptionTextSelected]}>{spec}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleClose} activeOpacity={0.75}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.75}>
              <MaterialIcons name="save" size={16} color="#00363d" />
              <Text style={styles.saveBtnText}>Cập nhật</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: { backgroundColor: '#161f21', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 12 },
  dragHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#3b494c', alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#dce4e5' },
  modalSubtitle: { fontSize: 12, color: '#849396', marginBottom: 4 },
  readOnlyContext: { backgroundColor: '#0d1516', padding: 10, borderRadius: 8, gap: 2 },
  readOnlyText: { fontSize: 11, color: '#849396' },
  readOnlyVal: { color: '#00daf3', fontWeight: '600' },
  formGroup: { gap: 4 },
  formLabel: { fontSize: 10, fontWeight: '700', color: '#849396', letterSpacing: 0.5 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0d1516', borderRadius: 8, paddingHorizontal: 10, height: 40, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  inputField: { flex: 1, color: '#dce4e5', fontSize: 13 },
  eyeButton: { padding: 4 },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleOption: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 38, borderRadius: 8, backgroundColor: '#0d1516', gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  roleOptionSelected: { backgroundColor: '#00daf3' },
  roleOptionText: { fontSize: 12, color: '#849396', fontWeight: '600' },
  roleOptionTextSelected: { color: '#00363d', fontWeight: '700' },
  specRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  specOption: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0d1516', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  specOptionSelected: { backgroundColor: 'rgba(0, 218, 243, 0.2)', borderColor: '#00daf3' },
  specOptionText: { fontSize: 11, color: '#849396' },
  specOptionTextSelected: { color: '#00daf3', fontWeight: '700' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 42, borderRadius: 8, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: '#bac9cc', fontWeight: '600', fontSize: 13 },
  saveBtn: { flex: 1, height: 42, borderRadius: 8, backgroundColor: '#00daf3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  saveBtnText: { color: '#00363d', fontWeight: '700', fontSize: 13 },
});
