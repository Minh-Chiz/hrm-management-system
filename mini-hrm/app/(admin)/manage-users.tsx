import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  useUsersQuery,
  useAddUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} from '@/hooks/queries/useUserQueries';
import { UserManagementTable, AddUserModal, EditUserModal } from '@/features/admin';
import { Employee } from '@/types';

export default function ManageUsersScreen({ hideBackButton = false }: { hideBackButton?: boolean } = {}) {
  const { data: employees = [], isLoading, refetch } = useUsersQuery();
  const addUserMutation = useAddUserMutation();
  const updateUserMutation = useUpdateUserMutation();
  const deleteUserMutation = useDeleteUserMutation();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpec, setSelectedSpec] = useState('Tất cả');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const specializations = useMemo(
    () => ['Tất cả', ...Array.from(new Set(employees.map((e) => e.specialization).filter(Boolean)))],
    [employees]
  );

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.specialization.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSpec = selectedSpec === 'Tất cả' || e.specialization === selectedSpec;
      return matchSearch && matchSpec;
    });
  }, [employees, searchQuery, selectedSpec]);

  const activeCount = useMemo(() => employees.filter((e) => e.status === 'Active').length, [employees]);

  const handleAddEmployee = (name: string, email: string, password: string, role: 'employee' | 'teamlead', spec: string) => {
    addUserMutation.mutate({ name, email, password, role, specialization: spec });
    setShowAddModal(false);
  };

  const handleSaveEdit = (id: string, updatedFields: any) => {
    updateUserMutation.mutate({ id, fields: updatedFields });
    setSelectedEmployee(null);
  };

  const handleDelete = (id: string) => {
    deleteUserMutation.mutate(id);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {!hideBackButton && (
            <TouchableOpacity style={styles.backBtn} onPress={() => (router.canGoBack() ? router.back() : router.replace('/(admin)/dashboard'))}>
              <MaterialIcons name="arrow-back" size={22} color="#bac9cc" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.title}>Quản lý Nhân sự</Text>
            <Text style={styles.subtitle}>{employees.length} tài khoản • {activeCount} đang hoạt động</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
          <MaterialIcons name="person-add" size={18} color="#00363d" />
          <Text style={styles.addBtnText}>Thêm mới</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <MaterialIcons name="search" size={18} color="#849396" />
          <TextInput style={styles.searchInput} placeholder="Tìm kiếm nhân viên, email..." placeholderTextColor="#3b494c" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.specFilterContainer}>
          {specializations.map((spec) => (
            <TouchableOpacity key={spec} style={[styles.specChip, selectedSpec === spec && styles.specChipActive]} onPress={() => setSelectedSpec(spec)}>
              <Text style={[styles.specChipText, selectedSpec === spec && styles.specChipTextActive]}>{spec}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="group-off" size={40} color="#3b494c" />
            <Text style={styles.emptyText}>Không tìm thấy nhân sự phù hợp</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <UserManagementTable key={item.id} item={item} onEdit={(emp) => setSelectedEmployee(emp)} onDelete={handleDelete} />
          ))
        )}
      </ScrollView>

      <AddUserModal visible={showAddModal} onClose={() => setShowAddModal(false)} onSave={handleAddEmployee} />
      <EditUserModal visible={Boolean(selectedEmployee)} employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} onSave={handleSaveEdit} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d1516' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56, borderBottomWidth: 1, borderBottomColor: 'rgba(59, 73, 76, 0.3)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#242b2d', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700', color: '#dce4e5' },
  subtitle: { fontSize: 11, color: '#849396' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#00daf3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { fontSize: 12, fontWeight: '700', color: '#00363d' },
  searchSection: { padding: 12, gap: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#161f21', borderRadius: 8, paddingHorizontal: 10, height: 38, gap: 6 },
  searchInput: { flex: 1, color: '#dce4e5', fontSize: 13 },
  specFilterContainer: { gap: 6 },
  specChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, backgroundColor: '#161f21' },
  specChipActive: { backgroundColor: '#00daf3' },
  specChipText: { fontSize: 11, color: '#849396' },
  specChipTextActive: { color: '#00363d', fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 12, paddingBottom: 80 },
  emptyState: { paddingVertical: 40, alignItems: 'center', gap: 8 },
  emptyText: { color: '#849396', fontSize: 13 },
});
