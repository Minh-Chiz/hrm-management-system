import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Employee } from '@/types';
import { getInitials, mapStatusEnum } from '@/utils';

interface UserManagementTableProps {
  item: Employee;
  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
}

const AVATAR_COLORS = ['#00e5ff', '#05e777', '#e9c400', '#c3f5ff', '#ffb4ab', '#7dffa2'];

function avatarColorFor(id: string) {
  const parsed = parseInt(id, 10);
  if (isNaN(parsed)) return AVATAR_COLORS[0];
  return AVATAR_COLORS[parsed % AVATAR_COLORS.length];
}

export function UserManagementTable({ item, onEdit, onDelete }: UserManagementTableProps) {
  const aColor = avatarColorFor(item.id);
  const statusInfo = mapStatusEnum(item.status);
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
      style={[styles.card, { borderLeftColor: item.accentColor || '#00e475' }]}
      onPress={() => onEdit(item)}
      activeOpacity={0.8}
    >
      {/* Avatar */}
      <View style={[styles.avatarCircle, { backgroundColor: `${aColor}1A`, borderColor: aColor }]}>
        <Text style={[styles.avatarText, { color: aColor }]}>{item.avatar || getInitials(item.name)}</Text>
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

        <View style={[styles.roleSpecBadge, isLead ? styles.roleSpecBadgeLead : styles.roleSpecBadgeEmp]}>
          <MaterialIcons
            name="work-outline"
            size={12}
            color={isLead ? '#7dffa2' : '#bac9cc'}
            style={{ marginRight: 4 }}
          />
          <Text style={[styles.roleSpecBadgeText, isLead ? styles.roleSpecBadgeTextLead : styles.roleSpecBadgeTextEmp]}>
            {roleName} • {item.specialization || 'Nhân sự'}
          </Text>
        </View>

        <Text style={styles.cardEmail} numberOfLines={1}>
          {item.email}
        </Text>
      </View>

      {/* Status & Actions */}
      <View style={styles.cardRight}>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>

        <View style={styles.cardActionButtons}>
          <TouchableOpacity onPress={() => onEdit(item)} style={styles.actionBtn} activeOpacity={0.7}>
            <MaterialIcons name="edit" size={17} color="#00e5ff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={confirmDelete} style={styles.actionBtn} activeOpacity={0.7}>
            <MaterialIcons name="delete-outline" size={17} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 30, 30, 0.65)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderLeftWidth: 4,
    gap: 10,
    marginBottom: 8,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardName: { fontSize: 14, fontWeight: '700', color: '#dce4e5', flexShrink: 1 },
  leadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(233, 196, 0, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  leadChipText: { fontSize: 9, fontWeight: '800', color: '#e9c400' },
  roleSpecBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 3, alignSelf: 'flex-start' },
  roleSpecBadgeLead: { backgroundColor: 'rgba(125, 255, 162, 0.1)', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 },
  roleSpecBadgeEmp: {},
  roleSpecBadgeText: { fontSize: 11 },
  roleSpecBadgeTextLead: { color: '#7dffa2', fontWeight: '600' },
  roleSpecBadgeTextEmp: { color: '#849396' },
  cardEmail: { fontSize: 11, color: '#849396', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusBadgeActive: { backgroundColor: 'rgba(5, 231, 119, 0.12)' },
  statusBadgeInactive: { backgroundColor: 'rgba(132, 147, 150, 0.12)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '600' },
  cardActionButtons: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255, 255, 255, 0.05)', alignItems: 'center', justifyContent: 'center' },
});
