import React, { useEffect, useState } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth, AuthUser } from '@/context/AuthContext';
import { Employee } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { CropImageModal } from '@/components/CropImageModal';
import { updateProfileSchema, UpdateProfileFormData } from '@/schemas/userSchema';
import { useUsersQuery, useUpdateUserProfileMutation, useUpdateUserMutation } from '@/hooks/queries/useUserQueries';


interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const { data: employees = [] } = useUsersQuery();
  const updateProfileMutation = useUpdateUserProfileMutation();
  const updateUserMutation = useUpdateUserMutation();
  const insets = useSafeAreaInsets();


  const activeEmp = employees.find((e) => e.name === user?.name || e.email === user?.email);
  const isAdmin = user?.role === 'admin';

  const [avatar, setAvatar] = useState('');
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [tempImageUri, setTempImageUri] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      phone: '0987654321',
      password: '',
      name: '',
      email: '',
      team: 'Frontend',
      specialization: 'Software Development',
    },
  });

  useEffect(() => {
    if (visible && user) {
      const initialAvatar = user.avatar || activeEmp?.avatar || '';
      setAvatar(initialAvatar);
      reset({
        phone: user.phone || activeEmp?.phone || '0987654321',
        password: activeEmp?.password || '',
        name: user.name || activeEmp?.name || '',
        email: user.email || activeEmp?.email || '',
        team: user.team || activeEmp?.team || 'Frontend',
        specialization: user.specialization || activeEmp?.specialization || 'Software Development',
        avatar: initialAvatar,
      });
    }
  }, [visible, user, activeEmp, reset]);

  const handlePickAvatar = async () => {
    try {
      // First try expo-image-picker
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets[0]) {
        setAvatar(pickerResult.assets[0].uri);
        return;
      }
    } catch (err) {
      // Fallback to DocumentPicker if ImagePicker fails
      try {
        const docResult = await DocumentPicker.getDocumentAsync({
          type: 'image/*',
          copyToCacheDirectory: true,
        });

        if (!docResult.canceled && docResult.assets && docResult.assets[0]) {
          setTempImageUri(docResult.assets[0].uri);
          setCropModalVisible(true);
        }
      } catch (error) {
        Alert.alert('Lỗi', 'Không thể mở trình chọn ảnh từ thiết bị.');
      }
    }
  };

  const handleRecropExisting = () => {
    if (avatar) {
      setTempImageUri(avatar);
      setCropModalVisible(true);
    } else {
      handlePickAvatar();
    }
  };

  const handleCropComplete = (croppedUri: string) => {
    setAvatar(croppedUri);
    setCropModalVisible(false);
    setTempImageUri(null);
  };

  const onSubmit = async (data: UpdateProfileFormData) => {
    try {
      const updatedAuthFields: Partial<AuthUser> = {
        phone: data.phone.trim(),
        avatar: avatar.trim(),
      };

      if (isAdmin) {
        if (data.name) updatedAuthFields.name = data.name.trim();
        if (data.email) updatedAuthFields.email = data.email.trim();
        if (data.team) updatedAuthFields.team = data.team.trim();
        if (data.specialization) updatedAuthFields.specialization = data.specialization.trim();
      }

      await updateProfile(updatedAuthFields);
      await updateProfileMutation.mutateAsync(updatedAuthFields);

      if (activeEmp) {
        const updatedEmpFields: Partial<Employee> = {
          phone: data.phone.trim(),
          avatar: avatar.trim(),
        };

        if (data.password?.trim()) {
          updatedEmpFields.password = data.password.trim();
        }

        if (isAdmin) {
          if (data.name) updatedEmpFields.name = data.name.trim();
          if (data.email) updatedEmpFields.email = data.email.trim();
          if (data.team) updatedEmpFields.team = data.team.trim();
          if (data.specialization) updatedEmpFields.specialization = data.specialization.trim();
        }

        await updateUserMutation.mutateAsync({ id: activeEmp.id, fields: updatedEmpFields });
      }

      Alert.alert('Thành công 🎉', 'Thông tin cá nhân và ảnh đại diện đã được lưu thành công.');

      onClose();
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể lưu thông tin cá nhân.');
    }
  };

  const isSaving = updateProfileMutation.isPending;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
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

            {/* Header */}
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
                  onPress={handleSubmit(onSubmit)}
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
              {/* Avatar Section */}
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
                  <Text style={styles.avatarSub}>Chạm vào avatar hoặc nút bên dưới để chọn & căn chỉnh góc ảnh đẹp nhất</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <TouchableOpacity style={styles.chooseImgBtn} onPress={handlePickAvatar} activeOpacity={0.75}>
                      <MaterialIcons name="add-photo-alternate" size={15} color="#00e5ff" />
                      <Text style={styles.chooseImgBtnText}>Chọn ảnh mới...</Text>
                    </TouchableOpacity>
                    {avatar ? (
                      <TouchableOpacity style={[styles.chooseImgBtn, { borderColor: 'rgba(0, 229, 255, 0.5)' }]} onPress={handleRecropExisting} activeOpacity={0.75}>
                        <MaterialIcons name="crop" size={15} color="#00e5ff" />
                        <Text style={styles.chooseImgBtnText}>Cắt lại góc ảnh</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Phone Number */}
              <Controller
                control={control}
                name="phone"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Số điện thoại cá nhân (*)</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="phone" size={18} color="#00e5ff" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Nhập số điện thoại..."
                        placeholderTextColor="#3b494c"
                        keyboardType="phone-pad"
                      />
                    </View>
                    {errors.phone ? (
                      <Text style={styles.errorText}>{errors.phone.message}</Text>
                    ) : null}
                  </View>
                )}
              />

              {/* Password */}
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Mật khẩu mới (Để trống nếu không đổi)</Text>
                    <View style={styles.inputWrapper}>
                      <MaterialIcons name="lock" size={18} color="#00e5ff" style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        value={value}
                        onChangeText={onChange}
                        placeholder="Nhập mật khẩu mới..."
                        placeholderTextColor="#3b494c"
                        secureTextEntry
                      />
                    </View>
                  </View>
                )}
              />

              {/* System Fields */}
              <View style={styles.divider} />
              <Text style={styles.sectionHeader}>Thông tin hệ thống</Text>

              {/* Full Name */}
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Họ và tên</Text>
                      {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                    </View>
                    <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                      <MaterialIcons name="person" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                        value={value}
                        onChangeText={onChange}
                        editable={isAdmin}
                      />
                    </View>
                  </View>
                )}
              />

              {/* Email */}
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Email công ty</Text>
                      {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                    </View>
                    <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                      <MaterialIcons name="email" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                        value={value}
                        onChangeText={onChange}
                        editable={isAdmin}
                      />
                    </View>
                  </View>
                )}
              />

              {/* Team */}
              <Controller
                control={control}
                name="team"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Phòng ban / Team</Text>
                      {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                    </View>
                    <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                      <MaterialIcons name="groups" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                        value={value}
                        onChangeText={onChange}
                        editable={isAdmin}
                      />
                    </View>
                  </View>
                )}
              />

              {/* Specialization */}
              <Controller
                control={control}
                name="specialization"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>Chuyên môn</Text>
                      {!isAdmin && <MaterialIcons name="lock-outline" size={13} color="#849396" />}
                    </View>
                    <View style={[styles.inputWrapper, !isAdmin && styles.inputDisabled]}>
                      <MaterialIcons name="work" size={18} color={isAdmin ? '#00daf3' : '#849396'} style={styles.inputIcon} />
                      <TextInput
                        style={[styles.input, !isAdmin && styles.inputTextDisabled]}
                        value={value}
                        onChangeText={onChange}
                        editable={isAdmin}
                      />
                    </View>
                  </View>
                )}
              />

              {/* Main Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, isSaving && styles.submitBtnDisabled, { marginTop: 12 }]}
                onPress={handleSubmit(onSubmit)}
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

      {/* Interactive Crop Image Modal */}
      <CropImageModal
        visible={cropModalVisible}
        imageUri={tempImageUri}
        onClose={() => {
          setCropModalVisible(false);
          setTempImageUri(null);
        }}
        onCropComplete={handleCropComplete}
        onPickAnotherImage={handlePickAvatar}
      />
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
  errorText: {
    color: '#ff4d4f',
    fontSize: 11,
    marginTop: 2,
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
