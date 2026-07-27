import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { useAuth, AuthUser } from '@/context/AuthContext';
import { useData, Employee } from '@/context/DataContext';
import { Avatar } from '@/components/ui/Avatar';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { employees, updateEmployee } = useData();
  const insets = useSafeAreaInsets();

  const activeEmp = employees.find((e) => e.name === user?.name || e.email === user?.email);
  const isAdmin = user?.role === 'admin';

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [password, setPassword] = useState('');
  const [team, setTeam] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible && user) {
      setName(user.name || activeEmp?.name || '');
      setEmail(user.email || activeEmp?.email || '');
      setPhone(user.phone || activeEmp?.phone || '0987654321');
      setAvatar(user.avatar || activeEmp?.avatar || '');
      setPassword(activeEmp?.password || '');
      setTeam(user.team || activeEmp?.team || 'Frontend');
      setSpecialization(user.specialization || activeEmp?.specialization || 'Software Development');
    }
  }, [visible, user, activeEmp]);

  const handlePickAvatar = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'image/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể mở trình chọn ảnh từ thiết bị.');
    }
  };

  const handleSave = async () => {
    if (!phone.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập số điện thoại.');
      return;
    }

    setIsSaving(true);

    try {
      // 1. Update Auth user session state
      const updatedAuthFields: Partial<AuthUser> = {
        phone: phone.trim(),
        avatar: avatar.trim(),
      };

      if (isAdmin) {
        updatedAuthFields.name = name.trim();
        updatedAuthFields.email = email.trim();
        updatedAuthFields.team = team.trim();
        updatedAuthFields.specialization = specialization.trim();
      }

      await updateProfile(updatedAuthFields);

      // 2. Update Employee record in DataContext if matched
      if (activeEmp) {
        const updatedEmpFields: Partial<Employee> = {
          phone: phone.trim(),
          avatar: avatar.trim(),
        };

        if (password.trim()) {
          updatedEmpFields.password = password.trim();
        }

        if (isAdmin) {
          updatedEmpFields.name = name.trim();
          updatedEmpFields.email = email.trim();
          updatedEmpFields.team = team.trim();
          updatedEmpFields.specialization = specialization.trim();
        }

        await updateEmployee(activeEmp.id, updatedEmpFields);
      }

      Alert.alert('Thành công 🎉', 'Thông tin cá nhân và ảnh đại diện đã được lưu thành công.');
      onClose();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu thông tin cá nhân.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop overlay to close modal on outside tap */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          pointerEvents="box-none"
        >
          <View
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            {/* Header with Save button & Close button */}
            <View style={styles.header}>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>
                <Text style={styles.subtitle}>
                  Cập nhật thông tin tài khoản cá nhân
                </Text>
              </View>
              <View style={styles.headerActionRow}>
                <TouchableOpacity
                  style={[styles.saveHeaderBtn, isSaving && styles.submitBtnDisabled]}
                  onPress={handleSave}
                  disabled={isSaving}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="check" size={16} color="#00363d" />
                  <Text style={styles.saveHeaderBtnText}>{isSaving ? 'Lưu...' : 'Lưu'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="close" size={20} color="#849396" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={true}
              contentContainerStyle={[styles.formContent, { paddingBottom: Math.max(insets.bottom + 40, 50) }]}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              scrollEventThrottle={16}
              decelerationRate="normal"
              bounces={true}
            >
              {/* ── Avatar Picker Section ── */}
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.avatarPickerBtn}
                  onPress={handlePickAvatar}
                  activeOpacity={0.8}
                >
                  <Avatar uri={avatar || user?.name || 'Avatar'} size={68} border borderColor="#00e5ff" borderWidth={2} />
                  <View style={styles.cameraIconBadge}>
                    <MaterialIcons name="photo-camera" size={13} color="#00363d" />
                  </View>
                </TouchableOpacity>
                <View style={{ flex: 1 }}>
                  <Text style={styles.avatarTitle}>Ảnh đại diện cá nhân</Text>
                  <Text style={styles.avatarSub}>Chạm vào khung hoặc nút bên dưới để tải ảnh từ máy</Text>
                  <TouchableOpacity style={styles.chooseImgBtn} onPress={handlePickAvatar} activeOpacity={0.75}>
                    <MaterialIcons name="add-photo-alternate" size={15} color="#00e5ff" />
                    <Text style={styles.chooseImgBtnText}>Chọn ảnh từ máy...</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ── Editable Field: Phone Number ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại cá nhân (*)</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="phone" size={18} color="#00e5ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Nhập số điện thoại..."
                    placeholderTextColor="#3b494c"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              {/* ── Editable Field: New Password ── */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu mới (Để trống nếu không đổi)</Text>
                <View style={styles.inputWrapper}>
                  <MaterialIcons name="lock" size={18} color="#00e5ff" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Nhập mật khẩu mới..."
                    placeholderTextColor="#3b494c"
                    secureTextEntry
                  />
                </View>
              </View>

              {/* ── System Fields ── */}
              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>
                Thông tin hệ thống
              </Text>

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Họ và tên</Text>
                  {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                </View>
                <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                  <MaterialIcons name="person" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                    value={name}
                    onChangeText={setName}
                    editable={isAdmin}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Email công ty</Text>
                  {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                </View>
                <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                  <MaterialIcons name="email" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                    value={email}
                    onChangeText={setEmail}
                    editable={isAdmin}
                  />
                </View>
              </View>

              {/* Department / Team */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Phòng ban / Team</Text>
                  {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                </View>
                <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                  <MaterialIcons name="groups" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                    value={team}
                    onChangeText={setTeam}
                    editable={isAdmin}
                  />
                </View>
              </View>

              {/* Specialization */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Chuyên môn</Text>
                  {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                </View>
                <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                  <MaterialIcons name="work" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                    value={specialization}
                    onChangeText={setSpecialization}
                    editable={isAdmin}
                  />
                </View>
              </View>

              {/* Main Submit Button in Form */}
              <TouchableOpacity
                style={[styles.submitBtn, isSaving && styles.submitBtnDisabled, { marginTop: 12 }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                <MaterialIcons name="check-circle" size={18} color="#00363d" />
                <Text style={styles.submitBtnText}>
                  {isSaving ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
                </Text>
              </TouchableOpacity>
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    maxHeight: '88%',
  },
  sheet: {
    backgroundColor: '#151d1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.5)',
    maxHeight: '100%',
    flexShrink: 1,
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b494c',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00e5ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  saveHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00363d',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dce4e5',
  },
  subtitle: {
    fontSize: 11,
    color: '#849396',
    marginTop: 3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#192122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formContent: {
    gap: 12,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#bac9cc',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#192122',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    paddingHorizontal: 12,
    height: 44,
  },
  inputDisabled: {
    backgroundColor: '#111718',
    borderColor: 'rgba(59, 73, 76, 0.25)',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#dce4e5',
  },
  inputTextDisabled: {
    color: '#849396',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(59, 73, 76, 0.3)',
    marginVertical: 4,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#849396',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00363d',
    letterSpacing: 0.5,
  },
  avatarSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 14,
    backgroundColor: '#192122',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    marginBottom: 4,
  },
  avatarPickerBtn: {
    position: 'relative',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#00e5ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#151d1e',
  },
  avatarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#dce4e5',
  },
  avatarSub: {
    fontSize: 11,
    color: '#849396',
    marginTop: 2,
    marginBottom: 8,
  },
  chooseImgBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 229, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
  },
  chooseImgBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00e5ff',
  },
});
