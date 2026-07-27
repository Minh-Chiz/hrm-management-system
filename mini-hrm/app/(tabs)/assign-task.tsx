import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState, useEffect } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ── Component con tái sử dụng ──────────────────────────────────────────────
import { Avatar } from '@/components/ui/Avatar';
import { AvatarGroup } from '@/components/ui/AvatarGroup';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/InputField';
import { useData } from '@/context/DataContext';

export interface Member {
  id: string;
  name: string;
  avatarUrl?: string;
  isLeader?: boolean;
}

// ── Kiểu dữ liệu ──────────────────────────────────────────────────────────
interface Task {
  id: string;
  title: string;
  deadlineDefault: string;
}

type ModalType = 'assignee' | 'supporters' | null;

// ============================================================================
// Sub-component: Hàng thành viên trong Modal lựa chọn
// ============================================================================
interface MemberRowProps {
  member: Member;
  isSelected: boolean;
  onPress: (member: Member) => void;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, isSelected, onPress }) => {
  const { employees } = useData();
  const empInfo = employees.find((e) => e.id === member.id);

  return (
    <Pressable
      onPress={() => onPress(member)}
      className="flex-row items-center justify-between px-4 py-3 rounded-xl mb-2"
      style={({ pressed }) => [
        { transform: [{ scale: pressed ? 0.98 : 1 }] },
        isSelected
          ? { backgroundColor: 'rgba(0, 229, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(0, 218, 243, 0.4)' }
          : { backgroundColor: '#192122' },
      ]}
    >
      <View className="flex-row items-center gap-3">
        <Avatar
          uri={member.avatarUrl || ''}
          size="md"
          showBadge={!!member.isLeader}
        />
        <View>
          <Text className="text-brand-on-surface font-semibold text-sm">{member.name}</Text>
          <Text className="text-brand-neon-dim text-xs mt-0.5 font-medium">
            {member.isLeader ? 'Trưởng nhóm' : 'Nhân viên'} {empInfo?.specialization ? `• ${empInfo.specialization}` : ''}
          </Text>
        </View>
      </View>

      {isSelected && (
        <View className="w-6 h-6 rounded-full bg-brand-neon items-center justify-center">
          <MaterialIcons name="check" size={16} color="#000000" />
        </View>
      )}
    </Pressable>
  );
};

// ============================================================================
// Sub-component: Bottom Sheet Modal dùng chung
// ============================================================================
interface BottomSheetModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const BottomSheetModal: React.FC<BottomSheetModalProps> = ({
  visible,
  title,
  onClose,
  children,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
  >
    {/* Overlay mờ bên ngoài */}
    <Pressable className="flex-1 bg-black/60" onPress={onClose} />

    {/* Nội dung sheet */}
    <View
      className="rounded-t-3xl pb-8"
      style={{ backgroundColor: '#151d1e', maxHeight: '75%', flexShrink: 1 }}
    >
      {/* Handle bar */}
      <View className="items-center pt-3 pb-4">
        <View className="w-10 h-1 rounded-full bg-brand-outline-variant" />
      </View>

      {/* Tiêu đề modal */}
      <View className="flex-row items-center justify-between px-5 mb-4">
        <Text className="text-brand-on-surface font-bold text-lg">{title}</Text>
        <Pressable
          onPress={onClose}
          className="w-8 h-8 items-center justify-center rounded-full active:scale-95 transition-all"
          style={{ backgroundColor: 'rgba(132, 147, 150, 0.15)' }}
        >
          <MaterialIcons name="close" size={18} color="#bac9cc" />
        </Pressable>
      </View>

      {children}
    </View>
  </Modal>
);

// ============================================================================
// Màn hình chính: Giao việc cho team
// ============================================================================
export default function AssignTaskScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { employees, addTask, addMasterProject } = useData();

  // Route Guard: only teamlead and admin can access this screen
  if (!user || (user.role !== 'teamlead' && user.role !== 'admin')) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0d1516' }}>
        <Redirect href="/" />
      </View>
    );
  }

  // Find the active employee record to identify their team
  const activeEmp = employees.find(e => e.name === user?.name);
  const activeTeam = activeEmp?.team;

  // Filter employees by team (admin gets all employees)
  const filteredEmployees = user?.role === 'admin'
    ? employees
    : employees.filter(e => e.team === activeTeam);

  // Map employees to Member objects for compatibility with existing UI
  const members: Member[] = filteredEmployees.map((emp) => ({
    id: emp.id,
    name: emp.name,
    avatarUrl: emp.email === 'nhanvien@vp.com' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCb6E2ZLpSa7m58AXlUtU3PiphLd3rfxLMIEtojv2VWoizJEqRrj1DGi_ZrpLv9C91SM_N_nzmztWZkwSTxjxzRkjJztmzfm5_7QWVcZHpdPiybg_QzITlxk-tCt38Wy2ksnp4cbdq_ADgKV-3E-DH9O-rWWb4bDaVfs7_oAcuj9aKg0T6LmsT8lCI-F-MCgYQhpNTE_V55M2P3PxsqVX37bm-PnJDHO8mdf4QOJ5_YzLU39PFtw-MTgw' :
      emp.email === 'nguyenthib@vp.com' ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQhts07G6DnEnkkm4wv-ZkdURbj53tJQW8cl-sIuiUHguC-tOHrJmxT-lJLC--G4mBqsszKEbUxVfcUelgBFoC-OLEzD28e9A0aVnjMr-kl8CKrpjqtCyNRtj_S1ZdxpQXkXxlJONy6oeorM_0YDNkiz7RlpdDjWmc2ROb9Jbjly-VY6cQYD8s51jfgqcfJu0WDXSEmfkQbZcEp0ZDlfDnEyNY8ICSd69otGggo_QSr7HbkX1bGTMVuw' :
        `https://i.pravatar.cc/150?img=${parseInt(emp.id, 10) ? (parseInt(emp.id, 10) * 8 + 4) : 10}`,
    isLeader: emp.role === 'teamlead',
  }));

  // ── State ──────────────────────────────────────────────────────────────
  const assignees = members; // Anyone in the team can be the primary assignee
  const [taskName, setTaskName] = useState<string>('');
  const [assignMode, setAssignMode] = useState<'single' | 'master'>('single');
  const [selectedAssignee, setSelectedAssignee] = useState<Member | null>(assignees[0] || null);
  const [selectedSupporters, setSelectedSupporters] = useState<Member[]>(
    members.filter((m) => m.id !== (assignees[0]?.id)).slice(0, 2)
  );
  const [deadline, setDeadline] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  // Auto sync initial assignee when employees finish loading asynchronously
  useEffect(() => {
    if (!selectedAssignee && assignees.length > 0) {
      const defaultAssignee = assignees[0];
      setSelectedAssignee(defaultAssignee);
      setSelectedSupporters(
        members.filter((m) => m.id !== defaultAssignee.id).slice(0, 2)
      );
    }
  }, [assignees, selectedAssignee, members]);

  // State tìm kiếm & lọc chuyên ngành trong Modal chọn người
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [selectedSpecFilter, setSelectedSpecFilter] = useState('Tất cả');

  // Danh sách chuyên ngành động lấy từ danh sách nhân viên
  const specializations = ['Tất cả', ...Array.from(new Set(employees.map(e => e.specialization).filter(Boolean)))];

  // Helper mở modal và reset bộ lọc tìm kiếm
  const openModal = useCallback((type: ModalType) => {
    setSearchMemberQuery('');
    setSelectedSpecFilter('Tất cả');
    setActiveModal(type);
  }, []);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleSelectAssignee = useCallback((member: Member) => {
    setSelectedAssignee(member);
    const selectedEmp = employees.find((e) => e.id === member.id);
    if (selectedEmp?.specialization) {
      setSelectedSupporters((prev) =>
        prev.filter((m) => {
          const emp = employees.find((e) => e.id === m.id);
          return emp?.specialization === selectedEmp.specialization && m.id !== member.id;
        })
      );
    }
    setActiveModal(null);
  }, [employees]);

  const handleToggleSupporter = useCallback((member: Member) => {
    setSelectedSupporters((prev) => {
      const isAlreadySelected = prev.some((m) => m.id === member.id);
      if (isAlreadySelected) {
        return prev.filter((m) => m.id !== member.id);
      }
      return [...prev, member];
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    if (assignMode === 'master') {
      if (user?.role !== 'admin' && user?.role !== 'teamlead') {
        Alert.alert('Không có quyền', 'Chỉ tài khoản Quản trị viên (Admin) hoặc Trưởng nhóm mới có quyền tạo Dự án Lớn.');
        return;
      }
      if (!taskName.trim()) {
        Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên Dự án Lớn.');
        return;
      }
      setIsSubmitting(true);
      await addMasterProject(
        taskName,
        deadline,
        budget,
        activeEmp?.id || user?.username,
        activeEmp?.name || user?.name
      );
      setIsSubmitting(false);

      Alert.alert(
        'Tạo Dự án Lớn thành công! 🚀',
        `Dự án "${taskName}" đã được kích hoạt dây chuyền. Chặng 1 (Thiết kế 🎨) đã tự động chuyển đến Hàng chờ của Trưởng nhóm Design.`,
        [{
          text: 'OK', onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else if (user?.role === 'teamlead') {
              router.replace({ pathname: '/(teamlead)/dashboard', params: { tab: 'projects' } });
            } else if (user?.role === 'admin') {
              router.replace('/(admin)/tasks');
            } else {
              router.replace('/');
            }
          }
        }]
      );
      return;
    }

    if (!taskName.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tên công việc trước khi phân công.');
      return;
    }
    if (!selectedAssignee) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn người phụ trách chính.');
      return;
    }

    setIsSubmitting(true);

    const supporterIds = selectedSupporters.map((s) => s.id);
    await addTask(taskName, selectedAssignee.id, supporterIds, deadline, undefined, undefined);

    setIsSubmitting(false);

    Alert.alert(
      'Phân công thành công! ✅',
      `Công việc "${taskName}" đã được giao cho ${selectedAssignee.name}.`,
      [{
        text: 'OK', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else if (user?.role === 'teamlead') {
            router.replace({ pathname: '/(teamlead)/dashboard', params: { tab: 'projects' } });
          } else if (user?.role === 'admin') {
            router.replace('/(admin)/tasks');
          } else {
            router.replace('/');
          }
        }
      }]
    );
  }, [assignMode, taskName, selectedAssignee, selectedSupporters, deadline, budget, addTask, addMasterProject, router, user]);

  const selectedAssigneeEmp = employees.find((e) => e.id === selectedAssignee?.id);
  const supporterAvatarUrls: string[] = selectedSupporters.map((m) => m.avatarUrl || '');

  // Lọc người phụ trách theo từ khóa & chuyên ngành
  const filteredAssignees = assignees.filter((m) => {
    const emp = employees.find((e) => e.id === m.id);
    const query = searchMemberQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      m.name.toLowerCase().includes(query) ||
      (emp?.specialization && emp.specialization.toLowerCase().includes(query));
    const matchesSpec =
      selectedSpecFilter === 'Tất cả' || emp?.specialization === selectedSpecFilter;
    return matchesQuery && matchesSpec;
  });

  // Tự động lọc người hỗ trợ có CÙNG chuyên ngành với Người phụ trách chính
  const availableSupporters = members.filter((m) => {
    if (m.id === selectedAssignee?.id) return false;
    if (!selectedAssigneeEmp?.specialization) return true;
    const emp = employees.find((e) => e.id === m.id);
    const query = searchMemberQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      m.name.toLowerCase().includes(query) ||
      (emp?.specialization && emp.specialization.toLowerCase().includes(query));
    return (
      emp?.specialization === selectedAssigneeEmp.specialization && matchesQuery
    );
  });

  return (
    <SafeAreaView className="flex-1 bg-[#0d1516]">
      <StatusBar style="light" />

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 60,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: 120,
          backgroundColor: 'rgba(0, 229, 255, 0.04)',
        }}
      />

      {/* Top App Bar */}
      <View className="flex-row items-center justify-between px-4 h-14">
        <Pressable
          onPress={() => {
            if (isNavigating) return;
            setIsNavigating(true);

            if (router.canGoBack()) {
              router.back();
            } else if (user?.role === 'teamlead') {
              router.replace({ pathname: '/(teamlead)/dashboard', params: { tab: 'projects' } });
            } else if (user?.role === 'admin') {
              router.replace('/(admin)/tasks');
            } else {
              router.replace('/');
            }

            setTimeout(() => setIsNavigating(false), 500);
          }}
          disabled={isNavigating}
          className="w-10 h-10 items-center justify-center rounded-full"
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
            { backgroundColor: 'rgba(46, 54, 56, 0.5)', opacity: isNavigating ? 0.5 : 1 }
          ]}
        >
          <MaterialIcons name="arrow-back" size={22} color="#bac9cc" />
        </Pressable>

        <Text className="font-bold text-xl absolute left-0 right-0 text-center text-[#00daf3]">
          Giao việc cho Team
        </Text>

        <Pressable
          className="w-10 h-10 items-center justify-center rounded-full"
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.92 : 1 }] },
            { backgroundColor: 'rgba(46, 54, 56, 0.5)' }
          ]}
        >
          <MaterialIcons name="more-vert" size={22} color="#bac9cc" />
        </Pressable>
      </View>

      {/* Main Content */}
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
        >
          {/* Segmented Switcher: Single Task vs Master Project */}
          <View className="flex-row p-1 rounded-2xl bg-[#192122] border border-brand-outline-variant/20 mb-2">
            <Pressable
              onPress={() => setAssignMode('single')}
              className="flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-2"
              style={{
                backgroundColor: assignMode === 'single' ? '#252525' : 'transparent',
                borderWidth: assignMode === 'single' ? 1 : 0,
                borderColor: assignMode === 'single' ? '#00daf3' : 'transparent',
              }}
            >
              <MaterialIcons name="assignment" size={18} color={assignMode === 'single' ? '#00daf3' : '#849396'} />
              <Text className={`text-xs font-bold ${assignMode === 'single' ? 'text-[#00daf3]' : 'text-[#849396]'}`}>
                Giao việc đơn lẻ
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (user?.role !== 'admin') {
                  Alert.alert('Hạn chế quyền hạn', 'Chỉ có tài khoản Quản trị viên (Admin) mới có quyền khởi tạo Dự án Lớn (Pipeline).');
                  return;
                }
                setAssignMode('master');
              }}
              className="flex-1 py-2.5 rounded-xl items-center justify-center flex-row gap-2"
              style={{
                backgroundColor: assignMode === 'master' ? 'rgba(0, 229, 255, 0.15)' : 'transparent',
                borderWidth: assignMode === 'master' ? 1 : 0,
                borderColor: assignMode === 'master' ? '#00daf3' : 'transparent',
                opacity: user?.role === 'admin' ? 1 : 0.65,
              }}
            >
              <MaterialIcons name={user?.role === 'admin' ? "rocket-launch" : "lock"} size={18} color={assignMode === 'master' ? '#00daf3' : '#849396'} />
              <Text className={`text-xs font-bold ${assignMode === 'master' ? 'text-[#00daf3]' : 'text-[#849396]'}`}>
                Dự án Lớn {user?.role !== 'admin' ? '(Chỉ Admin)' : '(Pipeline)'}
              </Text>
            </Pressable>
          </View>

          {/* Section 1: Tên công việc hoặc Tên Dự án Lớn */}
          <InputField
            label={assignMode === 'master' ? 'Tên Dự án Lớn (Master Project)' : 'Tên công việc'}
            value={taskName}
            onChangeText={setTaskName}
            placeholder={
              assignMode === 'master'
                ? 'VD: Phát triển tính năng Đăng nhập Vân tay / FaceID...'
                : 'Nhập tên công việc...'
            }
          />

          {assignMode === 'master' && (
            <View className="p-4 rounded-2xl bg-brand-neon-dim/10 border border-brand-neon-dim/30 gap-2">
              <View className="flex-row items-center gap-2">
                <MaterialIcons name="auto-awesome" size={20} color="#00daf3" />
                <Text className="text-[#00daf3] font-bold text-sm">Dây chuyền Tự động hóa (3 Chặng)</Text>
              </View>
              <Text className="text-brand-on-surface-variant text-xs leading-5">
                • <Text className="font-bold text-[#ff80ab]">Chặng 1 (Thiết kế 🎨)</Text> ➔ Chuyển đến Hàng chờ của Lead Design.{'\n'}
                • <Text className="font-bold text-[#f5cd00]">Chặng 2 (Lập trình 💻)</Text> ➔ Tự động chuyển giao khi Lead Design duyệt.{'\n'}
                • <Text className="font-bold text-[#00e5ff]">Chặng 3 (Kiểm thử 🧪)</Text> ➔ Tự động nghiệm thu toàn bộ khi QA duyệt.
              </Text>
            </View>
          )}

          {assignMode === 'single' && (
            <>
              {/* Section 2: Người phụ trách chính */}
              <View className="gap-2">
                <Text className="font-semibold text-xs text-brand-on-surface-variant uppercase tracking-wider">
                  Người phụ trách chính
                </Text>

                <Pressable
                  onPress={() => openModal('assignee')}
                  className="w-full h-16 flex-row items-center justify-between px-4 rounded-xl border border-brand-outline-variant/30 active:scale-[0.99] transition-all"
                  style={({ pressed }) => [
                    { transform: [{ scale: pressed ? 0.99 : 1 }] },
                    { backgroundColor: '#252525' }
                  ]}
                >
                  <View className="flex-row items-center">
                    {selectedAssignee ? (
                      <View className="flex-row items-center gap-3">
                        <Avatar
                          uri={selectedAssignee.avatarUrl || ''}
                          size="md"
                          showBadge
                          border
                          borderColor="rgba(132, 147, 150, 0.4)"
                        />
                        <View>
                          <Text className="text-brand-on-surface font-semibold text-sm">
                            {selectedAssignee.name}
                          </Text>
                          <Text className="text-brand-neon-dim text-xs mt-0.5 font-medium">
                            Phụ trách chính {selectedAssigneeEmp?.specialization ? `• ${selectedAssigneeEmp.specialization}` : ''}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <Text className="text-brand-outline text-sm">
                        Chọn người phụ trách chính...
                      </Text>
                    )}
                  </View>
                  <MaterialIcons name="arrow-drop-down" size={24} color="#bac9cc" />
                </Pressable>
              </View>

              {/* Section 3: Thành viên hỗ trợ */}
              <View className="gap-2">
                <Text className="font-semibold text-xs text-brand-on-surface-variant uppercase tracking-wider">
                  Thành viên hỗ trợ
                </Text>

                <View
                  className="flex-row items-center px-4 py-3 rounded-xl border border-brand-outline-variant/20"
                  style={{
                    backgroundColor: 'rgba(46, 54, 56, 0.4)',
                    borderWidth: 1,
                    borderColor: 'rgba(132, 147, 150, 0.1)',
                  }}
                >
                  {supporterAvatarUrls.length > 0 ? (
                    <AvatarGroup
                      avatars={supporterAvatarUrls}
                      avatarSize="md"
                      max={4}
                      onAddPress={() => openModal('supporters')}
                    />
                  ) : (
                    <Pressable
                      onPress={() => openModal('supporters')}
                      className="flex-row items-center gap-2 active:scale-95 transition-all"
                    >
                      <View
                        className="w-10 h-10 rounded-full border border-dashed items-center justify-center"
                        style={{ borderColor: 'rgba(0, 218, 243, 0.5)' }}
                      >
                        <MaterialIcons name="add" size={20} color="#00daf3" />
                      </View>
                      <Text className="text-brand-on-surface-variant text-sm">
                        Thêm thành viên hỗ trợ
                      </Text>
                    </Pressable>
                  )}

                  {selectedSupporters.length > 0 && (
                    <View className="ml-auto">
                      <Text className="text-brand-neon-dim font-semibold text-xs">
                        {selectedSupporters.length} người
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </>
          )}

          {/* Section 4: Hạn chót */}
          <InputField
            label="Hạn chót"
            value={deadline}
            onChangeText={setDeadline}
            placeholder="Nhập hạn chót (VD: 30/08/2026)..."
            iconName="event"
          />

          {/* Section 5: Vốn đầu tư / Ngân sách (Chỉ áp dụng cho Dự án Lớn) */}
          {assignMode === 'master' && (
            <View>
              <InputField
                label="Vốn đầu tư / Ngân sách dự án"
                value={budget}
                onChangeText={setBudget}
                placeholder="VD: 50.000.000 VNĐ"
                iconName="attach-money"
              />
              {/* Quick budget suggestion chips */}
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {['10.000.000 VNĐ', '25.000.000 VNĐ', '50.000.000 VNĐ', '100.000.000 VNĐ', '250.000.000 VNĐ'].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    style={{
                      backgroundColor: budget === amount ? 'rgba(0, 229, 255, 0.2)' : 'rgba(21, 29, 30, 0.8)',
                      borderColor: budget === amount ? '#00e5ff' : 'rgba(59, 73, 76, 0.5)',
                      borderWidth: 1,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 8,
                    }}
                    onPress={() => setBudget(amount)}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 11, color: budget === amount ? '#00e5ff' : '#bac9cc', fontWeight: budget === amount ? '700' : '500' }}>
                      + {amount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}


        </ScrollView>
      </KeyboardAvoidingView>

      {/* Action bar */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pt-3 pb-8 border-t border-brand-outline-variant/20"
        style={{ backgroundColor: 'rgba(13, 21, 22, 0.95)' }}
      >
        <Button
          title="PHÂN CÔNG CÔNG VIỆC"
          iconName="send"
          iconPosition="left"
          onPress={handleSubmit}
          loading={isSubmitting}
          size="lg"
          variant="primary"
          className="w-full rounded-2xl"
        />
      </View>

      {/* Modal: Chọn người phụ trách chính */}
      <BottomSheetModal
        visible={activeModal === 'assignee'}
        title="Chọn người phụ trách chính"
        onClose={() => setActiveModal(null)}
      >
        <View className="px-4 pb-3 gap-2">
          <InputField
            placeholder="Tìm theo tên hoặc chuyên ngành..."
            value={searchMemberQuery}
            onChangeText={setSearchMemberQuery}
            iconName="search"
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
            {specializations.map((spec) => (
              <Pressable
                key={spec}
                onPress={() => setSelectedSpecFilter(spec)}
                className="px-3 py-1.5 rounded-full mr-2"
                style={{
                  backgroundColor: selectedSpecFilter === spec ? 'rgba(0, 229, 255, 0.2)' : '#192122',
                  borderWidth: 1,
                  borderColor: selectedSpecFilter === spec ? '#00daf3' : 'rgba(132, 147, 150, 0.2)',
                }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: selectedSpecFilter === spec ? '#00daf3' : '#bac9cc' }}
                >
                  {spec}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filteredAssignees}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              isSelected={selectedAssignee?.id === item.id}
              onPress={handleSelectAssignee}
            />
          )}
          ListEmptyComponent={
            <View className="py-8 items-center justify-center">
              <MaterialIcons name="search-off" size={32} color="#849396" />
              <Text className="text-brand-on-surface-variant text-sm mt-2 font-medium">
                Không tìm thấy thành viên phù hợp
              </Text>
            </View>
          }
        />
      </BottomSheetModal>

      {/* Modal: Chọn thành viên hỗ trợ */}
      <BottomSheetModal
        visible={activeModal === 'supporters'}
        title={`Chọn người hỗ trợ (${selectedAssigneeEmp?.specialization || 'Cùng chuyên ngành'})`}
        onClose={() => setActiveModal(null)}
      >
        <View className="px-4 pb-3">
          <InputField
            placeholder="Tìm người hỗ trợ..."
            value={searchMemberQuery}
            onChangeText={setSearchMemberQuery}
            iconName="search"
          />
        </View>

        <FlatList
          data={availableSupporters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <MemberRow
              member={item}
              isSelected={selectedSupporters.some((m) => m.id === item.id)}
              onPress={handleToggleSupporter}
            />
          )}
          ListEmptyComponent={
            <View className="py-8 items-center justify-center">
              <MaterialIcons name="people-outline" size={32} color="#849396" />
              <Text className="text-brand-on-surface-variant text-sm mt-2 font-medium">
                Không có thành viên cùng chuyên ngành ({selectedAssigneeEmp?.specialization || ''})
              </Text>
            </View>
          }
          ListFooterComponent={
            <View className="px-0 pt-3 pb-2">
              <Button
                title={`Xác nhận (${selectedSupporters.length} người)`}
                variant="primary"
                size="md"
                onPress={() => setActiveModal(null)}
                className="w-full rounded-xl"
              />
            </View>
          }
        />
      </BottomSheetModal>
    </SafeAreaView>
  );
}