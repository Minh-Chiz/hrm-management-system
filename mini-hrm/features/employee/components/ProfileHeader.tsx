import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ProfileHeaderProps } from '../types/dashboard';

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  unreadNotiCount,
  onOpenNotificationModal,
  onOpenCreateRequestModal,
  onLogout,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 8 : 12 }]}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarWrapper}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={22} color="#00e5ff" />
          </View>
          <View style={styles.onlineDot} />
        </View>
        <View>
          <Text style={styles.headerName}>{user?.name ?? 'Nhân viên'}</Text>
          <Text style={styles.headerPosition}>
            {user?.role === 'employee' ? 'Nhân viên' : 'Trưởng nhóm'} - {user?.specialization || 'Chuyên viên'}
          </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.iconBtnPrimary}
          activeOpacity={0.8}
          onPress={onOpenCreateRequestModal}
        >
          <MaterialIcons name="post-add" size={22} color="#00daf3" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={onOpenNotificationModal}
        >
          <View>
            <MaterialIcons name="notifications-none" size={22} color="#bac9cc" />
            {unreadNotiCount > 0 && (
              <View style={styles.notiBadge}>
                <Text style={styles.notiBadgeText}>{unreadNotiCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} onPress={onLogout} activeOpacity={0.7}>
          <MaterialIcons name="logout" size={20} color="#ff4d4f" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(13,21,22,0.92)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,73,76,0.25)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,229,255,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(0,229,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#05e777',
    borderWidth: 2,
    borderColor: '#0d1516',
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#dce4e5',
  },
  headerPosition: {
    fontSize: 11,
    color: '#849396',
    marginTop: 1,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#192122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPrimary: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,218,243,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,218,243,0.45)',
  },
  notiBadge: {
    position: 'absolute',
    top: -4,
    right: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff4d4f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#0d1516',
    paddingHorizontal: 2,
  },
  notiBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 11,
  },
});
