import React, { useState } from 'react';
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

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    email: string,
    password: string,
    role: 'employee' | 'teamlead',
    specialization: string
  ) => void;
}

export function AddUserModal({ visible, onClose, onSave }: AddUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'employee' | 'teamlead'>('employee');
  const [specialization, setSpecialization] = useState('Frontend');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = () => {
    setErrorMessage(null);
    if (!name.trim()) return setErrorMessage('Họ và tên không được bỏ trống');
    if (!email.trim()) return setErrorMessage('Email không được bỏ trống');
    if (!password.trim()) return setErrorMessage('Mật khẩu không được bỏ trống');

    onSave(name.trim(), email.trim(), password, role, specialization);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('employee');
    setSpecialization('Frontend');
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />
        <View style={styles.modalSheet}>
          <View style={styles.dragHandle} />
          <Text style={styles.modalTitle}>Thêm nhân sự mới</Text>
          <Text style={styles.modalSubtitle}>Điền thông tin cơ bản. Trạng thái mặc định là Active.</Text>

          {errorMessage && <AlertBox message={errorMessage} />}

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>HỌ VÀ TÊN</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person-outline" size={16} color="#849396" />
              <TextInput style={styles.inputField} placeholder="Ví dụ: Nguyễn Thị X" placeholderTextColor="#3b494c" value={name} onChangeText={setName} autoCapitalize="words" />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>EMAIL CÔNG TY</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="email" size={16} color="#849396" />
              <TextInput style={styles.inputField} placeholder="Ví dụ: tenx@vp.com" placeholderTextColor="#3b494c" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>MẬT KHẨU KHỞI TẠO</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={16} color="#849396" />
              <TextInput style={styles.inputField} placeholder="Nhập mật khẩu khởi tạo" placeholderTextColor="#3b494c" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoCapitalize="none" />
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
              <MaterialIcons name="check" size={16} color="#00363d" />
              <Text style={styles.saveBtnText}>Lưu nhân sự</Text>
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
