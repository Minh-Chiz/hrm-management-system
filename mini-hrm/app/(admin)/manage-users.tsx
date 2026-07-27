import { AlertBox } from '@/components/ui/AlertBox';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useData, Employee } from '@/context/DataContext';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    role: 'employee',
    email: 'nguyenvana@vp.com',
    avatar: 'NV',
    status: 'Active',
    accentColor: '#00e475',
    password: 'userpassword',
    specialization: 'Frontend',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    role: 'employee',
    email: 'tranthib@vp.com',
    avatar: 'TT',
    status: 'Inactive',
    accentColor: '#849396',
    password: 'userpassword',
    specialization: 'Mobile',
  },
  {
    id: '3',
    name: 'Lê Hoàng Dương',
    role: 'teamlead',
    email: 'duong@vp.com',
    avatar: 'LH',
    status: 'Active',
    accentColor: '#00daf3',
    password: 'secretpassword',
    specialization: 'Frontend',
  },
  {
    id: '4',
    name: 'Phạm Minh D',
    role: 'employee',
    email: 'phamminhd@vp.com',
    avatar: 'PM',
    status: 'Active',
    accentColor: '#00e475',
    password: 'userpassword',
    specialization: 'Backend',
  },
  {
    id: '5',
    name: 'Hoàng Thu E',
    role: 'employee',
    email: 'hoangthu@vp.com',
    avatar: 'HT',
    status: 'Inactive',
    accentColor: '#849396',
    password: 'userpassword',
    specialization: 'Tester',
  },
  {
    id: '6',
    name: 'Vũ Lan F',
    role: 'teamlead',
    email: 'vulan@vp.com',
    avatar: 'VL',
    status: 'Active',
    accentColor: '#00daf3',
    password: 'secretpassword',
    specialization: 'Backend',
  },
];

// ─── Avatar color palette ────────────────────────────────────────────────────

const AVATAR_COLORS = ['#00e5ff', '#05e777', '#e9c400', '#c3f5ff', '#ffb4ab', '#7dffa2'];

function avatarColorFor(id: string) {
  return AVATAR_COLORS[parseInt(id, 10) % AVATAR_COLORS.length];
}

// ─── Animated Press Button ────────────────────────────────────────────────────

interface ScalePressProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}

function ScalePress({ children, onPress, style }: ScalePressProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, speed: 50 }).start();
  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 50 }).start();

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View style={[style, { transform: [{ scale }] }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Employee Card ────────────────────────────────────────────────────────────

interface EmployeeCardProps {
  item: Employee;
  onDelete: (id: string) => void;
  onEdit: (employee: Employee) => void;
}

function EmployeeCard({ item, onDelete, onEdit }: EmployeeCardProps) {
  const aColor = avatarColorFor(item.id);
  const isActive = item.status === 'Active';
  const isLead = item.role === 'teamlead';
  const roleName = isLead ? 'Trưởng nhóm' : 'Nhân viên';

  const confirmDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa nhân viên "${item.name}" khỏi hệ thống?`,
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Xóa', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: item.accentColor }]}
      onPress={() => onEdit(item)}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View
        style={[
          styles.avatarCircle,
          { backgroundColor: `${aColor}1A`, borderColor: aColor },
        ]}
      >
        <Text style={[styles.avatarText, { color: aColor }]}>{item.avatar}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>
          {isLead && (
            <View style={styles.leadChip}>
              <MaterialIcons name="star" size={9} color="#e9c400" />
              <Text style={styles.leadChipText}>LEAD</Text>
            </View>
          )}
        </View>

        {/* Hiển thị Chức vụ + Chuyên ngành */}
        <View
          style={[
            styles.roleSpecBadge,
            isLead ? styles.roleSpecBadgeLead : styles.roleSpecBadgeEmp,
          ]}
        >
          <MaterialIcons
            name="work-outline"
            size={12}
            color={isLead ? '#7dffa2' : '#bac9cc'}
            style={{ marginRight: 4 }}
          />
          <Text
            style={[
              styles.roleSpecBadgeText,
              isLead ? styles.roleSpecBadgeTextLead : styles.roleSpecBadgeTextEmp,
            ]}
          >
            {roleName} • {item.specialization}
          </Text>
        </View>

        <Text style={styles.cardEmail} numberOfLines={1}>
          {item.email}
        </Text>

        {isLead && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
            <MaterialIcons name="account-balance-wallet" size={12} color="#00e5ff" />
            <Text style={{ fontSize: 11, color: '#7dffa2', fontWeight: '600' }}>Ngân sách quản lý: 150.000.000 VNĐ</Text>
          </View>
        )}
      </View>

      {/* Right side: status badge + actions */}
      <View style={styles.cardRight}>
        <View
          style={[
            styles.statusBadge,
            isActive ? styles.statusBadgeActive : styles.statusBadgeInactive,
          ]}
        >
          <View style={[styles.statusDot, { backgroundColor: isActive ? '#05e777' : '#849396' }]} />
          <Text
            style={[
              styles.statusText,
              { color: isActive ? '#05e777' : '#849396' },
            ]}
          >
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>

        <View style={styles.cardActionButtons}>
          <ScalePress onPress={() => onEdit(item)} style={styles.editBtn}>
            <MaterialIcons name="edit" size={17} color="#00e5ff" />
          </ScalePress>

          <ScalePress onPress={confirmDelete} style={styles.deleteBtn}>
            <MaterialIcons name="delete-outline" size={17} color="#ff4d4f" />
          </ScalePress>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Add Employee Modal ───────────────────────────────────────────────────────

interface AddModalProps {
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

function AddModal({ visible, onClose, onSave }: AddModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'employee' | 'teamlead'>('employee');
  const [newSpecialization, setNewSpecialization] = useState('Frontend');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage('Họ và tên không được bỏ trống');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email không được bỏ trống');
      return;
    }
    if (!password.trim()) {
      setErrorMessage('Mật khẩu không được bỏ trống');
      return;
    }

    onSave(name.trim(), email.trim(), password, role, newSpecialization);
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('employee');
    setNewSpecialization('Frontend');
  };

  const handleClose = () => {
    setName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRole('employee');
    setNewSpecialization('Frontend');
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />

        <View style={styles.modalSheet}>
          <View style={styles.dragHandle} />

          <Text style={styles.modalTitle}>Thêm nhân sự mới</Text>
          <Text style={styles.modalSubtitle}>
            Điền thông tin cơ bản. Trạng thái mặc định là Active.
          </Text>

          {errorMessage && (
            <View style={{ marginBottom: 12 }}>
              <AlertBox message={errorMessage} />
            </View>
          )}

          {/* Name input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>HỌ VÀ TÊN</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="person-outline" size={16} color="#849396" />
              <TextInput
                style={styles.inputField}
                placeholder="Ví dụ: Nguyễn Thị X"
                placeholderTextColor="#3b494c"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Email input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>EMAIL CÔNG TY</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="email" size={16} color="#849396" />
              <TextInput
                style={styles.inputField}
                placeholder="Ví dụ: tenx@vp.com"
                placeholderTextColor="#3b494c"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Password input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>MẬT KHẨU KHỞI TẠO</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={16} color="#849396" />
              <TextInput
                style={styles.inputField}
                placeholder="Nhập mật khẩu khởi tạo"
                placeholderTextColor="#3b494c"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={16}
                  color="#849396"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role selector */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>CHỨC VỤ</Text>
            <View style={styles.roleRow}>
              {([
                { value: 'employee', label: 'Nhân viên', icon: 'person' },
                { value: 'teamlead', label: 'Trưởng nhóm', icon: 'supervisor-account' },
              ] as const).map((opt) => {
                const isSelected = role === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                    onPress={() => setRole(opt.value)}
                    activeOpacity={0.75}
                  >
                    <MaterialIcons
                      name={opt.icon as keyof typeof MaterialIcons.glyphMap}
                      size={16}
                      color={isSelected ? '#00363d' : '#849396'}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        isSelected && styles.roleOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Specialization selector */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>CHUYÊN NGÀNH</Text>
            <View style={styles.specRow}>
              {['Frontend', 'Backend', 'Mobile', 'Tester', 'UI/UX Design'].map((spec) => {
                const isSelected = newSpecialization === spec;
                return (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.specOption,
                      isSelected && styles.specOptionSelected,
                    ]}
                    onPress={() => setNewSpecialization(spec)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.specOptionText,
                        isSelected && styles.specOptionTextSelected,
                      ]}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <ScalePress onPress={handleSave} style={styles.saveBtn}>
              <MaterialIcons name="check" size={16} color="#00363d" />
              <Text style={styles.saveBtnText}>Lưu nhân sự</Text>
            </ScalePress>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Edit Employee Modal ──────────────────────────────────────────────────────

interface EditModalProps {
  visible: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (
    id: string,
    updatedData: { role: 'employee' | 'teamlead'; password: string; specialization: string }
  ) => void;
}

function EditModal({ visible, employee, onClose, onSave }: EditModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<'employee' | 'teamlead'>('employee');
  const [editSpecialization, setEditSpecialization] = useState('Frontend');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (employee) {
      setPassword(employee.password || '');
      setRole(employee.role);
      setEditSpecialization(employee.specialization || 'Frontend');
      setErrorMessage(null);
      setShowPassword(false);
    }
  }, [employee, visible]);

  const handleSave = () => {
    setErrorMessage(null);
    if (!password.trim()) {
      setErrorMessage('Mật khẩu không được bỏ trống');
      return;
    }
    if (!employee) return;

    onSave(employee.id, {
      role,
      password,
      specialization: editSpecialization,
    });
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleClose} />

        <View style={styles.modalSheet}>
          <View style={dragHandleStyle().dragHandle} />

          <Text style={styles.modalTitle}>Chỉnh sửa nhân sự</Text>
          <Text style={styles.modalSubtitle}>
            Thay đổi chức vụ, chuyên ngành hoặc đổi mật khẩu của nhân sự.
          </Text>

          {errorMessage && (
            <View style={{ marginBottom: 12 }}>
              <AlertBox message={errorMessage} />
            </View>
          )}

          {/* Context Read-Only info */}
          <View style={styles.readOnlyContext}>
            <Text style={styles.readOnlyLabel}>Họ và tên: <Text style={styles.readOnlyValue}>{employee?.name}</Text></Text>
            <Text style={styles.readOnlyLabel}>Email: <Text style={styles.readOnlyValue}>{employee?.email}</Text></Text>
          </View>

          {/* Password input */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>ĐỔI MẬT KHẨU MỚI</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons name="lock-outline" size={16} color="#849396" />
              <TextInput
                style={styles.inputField}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#3b494c"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={16}
                  color="#849396"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Role selector */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>THĂNG CHỨC / HẠ CHỨC</Text>
            <View style={styles.roleRow}>
              {([
                { value: 'employee', label: 'Nhân viên', icon: 'person' },
                { value: 'teamlead', label: 'Trưởng nhóm', icon: 'supervisor-account' },
              ] as const).map((opt) => {
                const isSelected = role === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.roleOption, isSelected && styles.roleOptionSelected]}
                    onPress={() => setRole(opt.value)}
                    activeOpacity={0.75}
                  >
                    <MaterialIcons
                      name={opt.icon as keyof typeof MaterialIcons.glyphMap}
                      size={16}
                      color={isSelected ? '#00363d' : '#849396'}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        isSelected && styles.roleOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Specialization selector */}
          <View style={styles.formGroup}>
            <Text style={styles.formLabel}>CHUYÊN NGÀNH</Text>
            <View style={styles.specRow}>
              {['Frontend', 'Backend', 'Mobile', 'Tester', 'UI/UX Design'].map((spec) => {
                const isSelected = editSpecialization === spec;
                return (
                  <TouchableOpacity
                    key={spec}
                    style={[
                      styles.specOption,
                      isSelected && styles.specOptionSelected,
                    ]}
                    onPress={() => setEditSpecialization(spec)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.specOptionText,
                        isSelected && styles.specOptionTextSelected,
                      ]}
                    >
                      {spec}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Buttons */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleClose}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>

            <ScalePress onPress={handleSave} style={styles.saveBtn}>
              <MaterialIcons name="save" size={16} color="#00363d" />
              <Text style={styles.saveBtnText}>Cập nhật</Text>
            </ScalePress>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// Helper to avoid name clash in dragHandle or similar layout styling
function dragHandleStyle() {
  return StyleSheet.create({
    dragHandle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#3b494c',
      alignSelf: 'center',
      marginBottom: 16,
    }
  });
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ManageUsersScreen({ hideBackButton = false }: { hideBackButton?: boolean } = {}) {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedSpec, setSelectedSpec] = useState('Tất cả');

  // Lấy danh sách chuyên ngành động
  const specializations = ['Tất cả', ...Array.from(new Set(employees.map(e => e.specialization)))];

  // ── Filtered list ──
  const filtered = employees.filter((e) => {
    const matchSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.role === 'employee' ? 'nhân viên' : 'trưởng nhóm').includes(searchQuery.toLowerCase());

    const matchSpec = selectedSpec === 'Tất cả' || e.specialization === selectedSpec;

    return matchSearch && matchSpec;
  });

  const activeCount = employees.filter((e) => e.status === 'Active').length;

  // ── Handlers ──
  const handleDelete = (id: string) => {
    deleteEmployee(id);
  };

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowEditModal(true);
  };

  const handleAddEmployee = (
    name: string,
    email: string,
    password: string,
    role: 'employee' | 'teamlead',
    specialization: string
  ) => {
    addEmployee(name, email, password, role, specialization);
    setShowAddModal(false);
  };

  const handleSaveEdit = (
    id: string,
    updatedData: { role: 'employee' | 'teamlead'; password: string; specialization: string }
  ) => {
    updateEmployee(id, {
      role: updatedData.role,
      password: updatedData.password,
      specialization: updatedData.specialization,
      accentColor: updatedData.role === 'teamlead' ? '#00daf3' : '#00e475',
    });
    setShowEditModal(false);
    setSelectedEmployee(null);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!hideBackButton && (
            <ScalePress
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(admin)/dashboard');
                }
              }}
              style={styles.backBtn}
            >
              <MaterialIcons name="arrow-back" size={22} color="#bac9cc" />
            </ScalePress>
          )}
          <View>
            <Text style={styles.headerTitle}>Danh sách nhân sự</Text>
            <Text style={styles.headerSub}>
              Tổng số: {employees.length} · Active: {activeCount}
            </Text>
          </View>
        </View>

        <ScalePress
          onPress={() => setShowAddModal(true)}
          style={styles.addBtn}
        >
          <MaterialIcons name="person-add" size={16} color="#00363d" />
          <Text style={styles.addBtnText}>Thêm</Text>
        </ScalePress>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color="#849396" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm tên, email, chuyên ngành..."
          placeholderTextColor="#3b494c"
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
            <MaterialIcons name="close" size={18} color="#849396" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Specialization Filter Chips ── */}
      <View style={styles.specFilterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specFilterScroll} nestedScrollEnabled={true} scrollEventThrottle={16}>
          {specializations.map((spec) => {
            const isSelected = selectedSpec === spec;
            return (
              <TouchableOpacity
                key={spec}
                style={[styles.specChip, isSelected && styles.specChipActive]}
                onPress={() => setSelectedSpec(spec)}
                activeOpacity={0.75}
              >
                <Text style={[styles.specChipText, isSelected && styles.specChipTextActive]}>
                  {spec}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Result count when filtering ── */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultBar}>
          <Text style={styles.searchResultText}>
            Tìm thấy {filtered.length} kết quả cho "{searchQuery}"
          </Text>
        </View>
      )}

      {/* ── Employee List ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="people-outline" size={52} color="#2e3638" />
            <Text style={styles.emptyTitle}>Không tìm thấy</Text>
            <Text style={styles.emptySubtitle}>
              Không tìm thấy nhân viên nào khớp với từ khóa tìm kiếm.
            </Text>
          </View>
        ) : (
          filtered.map((emp) => (
            <EmployeeCard
              key={emp.id}
              item={emp}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Add Modal ── */}
      <AddModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddEmployee}
      />

      {/* ── Edit Modal ── */}
      <EditModal
        visible={showEditModal}
        employee={selectedEmployee}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployee(null);
        }}
        onSave={handleSaveEdit}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1516',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59, 73, 76, 0.35)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#192122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dce4e5',
    lineHeight: 20,
  },
  headerSub: {
    fontSize: 11,
    color: '#849396',
    marginTop: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#00e5ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00363d',
    letterSpacing: 0.3,
  },

  /* ── Search bar ── */
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#252525',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 2,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: '#3b494c',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#dce4e5',
    fontSize: 14,
    height: '100%',
  },
  searchResultBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 2,
  },
  searchResultText: {
    fontSize: 11,
    color: '#00daf3',
    fontWeight: '500',
  },

  /* ── Scroll ── */
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },

  /* ── Employee Card ── */
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#192122',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    borderRightColor: 'rgba(255,255,255,0.04)',
    borderBottomColor: 'rgba(255,255,255,0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  avatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#dce4e5',
    flexShrink: 1,
  },
  leadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(233, 196, 0, 0.14)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(233, 196, 0, 0.30)',
  },
  leadChipText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#e9c400',
    letterSpacing: 0.8,
  },
  cardEmail: {
    fontSize: 11,
    color: '#849396',
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 8,
    flexShrink: 0,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(5, 231, 119, 0.12)',
  },
  statusBadgeInactive: {
    backgroundColor: 'rgba(132, 147, 150, 0.12)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  cardActionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 229, 255, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.22)',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 77, 79, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 79, 0.22)',
  },

  /* ── Empty State ── */
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 72,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#849396',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#3b494c',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 18,
  },

  /* ── Modal ── */
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalSheet: {
    backgroundColor: '#151d1e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.5)',
    gap: 4,
    maxHeight: '90%',
    flexShrink: 1,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3b494c',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#dce4e5',
    marginBottom: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#849396',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
    gap: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#849396',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#192122',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b494c',
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  inputField: {
    flex: 1,
    color: '#dce4e5',
    fontSize: 14,
    height: '100%',
  },
  eyeButton: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  roleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#192122',
    borderWidth: 1.5,
    borderColor: '#3b494c',
  },
  roleOptionSelected: {
    backgroundColor: '#00e5ff',
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  roleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#849396',
  },
  roleOptionTextSelected: {
    color: '#00363d',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#3b494c',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#192122',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#849396',
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 5,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00363d',
  },

  /* Read-Only Context in Edit Modal */
  readOnlyContext: {
    backgroundColor: '#192122',
    borderWidth: 1,
    borderColor: '#3b494c',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    gap: 4,
  },
  readOnlyLabel: {
    fontSize: 12,
    color: '#849396',
  },
  readOnlyValue: {
    fontSize: 13,
    color: '#dce4e5',
    fontWeight: '600',
  },

  /* ── Role & Specialization Badge ── */
  roleSpecBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
    marginBottom: 2,
  },
  roleSpecBadgeEmp: {
    backgroundColor: 'rgba(132, 147, 150, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(132, 147, 150, 0.25)',
  },
  roleSpecBadgeLead: {
    backgroundColor: 'rgba(5, 231, 119, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(5, 231, 119, 0.30)',
  },
  roleSpecBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  roleSpecBadgeTextEmp: {
    color: '#bac9cc',
  },
  roleSpecBadgeTextLead: {
    color: '#7dffa2',
  },

  /* ── Segmented Control Specialization selector ── */
  specRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#192122',
    borderWidth: 1.5,
    borderColor: '#3b494c',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '28%',
  },
  specOptionSelected: {
    backgroundColor: 'rgba(0, 229, 255, 0.10)',
    borderColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  specOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#849396',
  },
  specOptionTextSelected: {
    color: '#00e5ff',
    fontWeight: '700',
  },

  /* ── Specialization Filter Chips ── */
  specFilterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  specFilterScroll: {
    gap: 8,
    paddingVertical: 6,
  },
  specChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#192122',
    borderWidth: 1.5,
    borderColor: '#3b494c',
  },
  specChipActive: {
    backgroundColor: 'rgba(0, 229, 255, 0.12)',
    borderColor: '#00e5ff',
  },
  specChipText: {
    fontSize: 12,
    color: '#849396',
    fontWeight: '600',
  },
  specChipTextActive: {
    color: '#00e5ff',
    fontWeight: '700',
  },
});
