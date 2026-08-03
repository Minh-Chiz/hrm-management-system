import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CheckInCardProps } from '../types/dashboard';
import { formatMinutesToText, formatMinutesCompact, evaluateCheckInStatus, evaluateCheckOutStatus } from '@/constants/shifts';
import { formatDateCompact } from '@/utils';

export const CheckInCard: React.FC<CheckInCardProps> = ({
  shiftInfo,
  checkInsHistory,
  wifiSSID = 'Office_5G',
  isCompanyWifi = true,
  onToggleWifi,
  onCheckInPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const handlePress = () => {
    pulseAnim.setValue(0);
    Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    onCheckInPress();
  };

  const pulseScale = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] });

  const {
    isCompletedToday,
    checkedIn,
    activeShiftName,
    timeStr,
    dateStr,
    shiftStartTime,
    shiftEndTime,
    isLateCheckIn,
    lateMinutes,
    isShiftEnded,
    latestInRecord,
  } = shiftInfo;

  return (
    <View style={styles.container}>
      {/* Time Banner */}
      <View style={styles.timeBanner}>
        <Text style={styles.timeText}>{timeStr}</Text>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      {/* Attendance Button Card */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Chấm công hôm nay</Text>
          <View style={styles.shiftBadge}>
            <MaterialIcons name="access-time" size={13} color="#00e5ff" />
            <Text style={styles.shiftBadgeText}>
              {activeShiftName} ({shiftStartTime} - {shiftEndTime})
            </Text>
          </View>
        </View>

        <View style={styles.attendanceCard}>
          <View style={styles.buttonContainer}>
            <View style={[styles.attendanceGlow, (checkedIn || isCompletedToday) && styles.attendanceGlowActive, !isCompanyWifi && styles.attendanceGlowBlocked]} />
            <View style={[styles.fingerprintGlow, (checkedIn || isCompletedToday) && styles.fingerprintGlowActive, !isCompanyWifi && styles.fingerprintGlowBlocked]} />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.checkInRipple,
                (checkedIn || isCompletedToday) && styles.checkInRippleActive,
                !isCompanyWifi && styles.checkInRippleBlocked,
                { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
              ]}
            />
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
              <Animated.View
                style={[
                  styles.checkInButton,
                  (checkedIn || isCompletedToday) && styles.checkInButtonActive,
                  !isCompanyWifi && styles.checkInButtonBlocked,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <MaterialIcons
                  name={!isCompanyWifi ? 'wifi-off' : 'fingerprint'}
                  size={52}
                  color={!isCompanyWifi ? '#ff4d4f' : isCompletedToday ? '#7dffa2' : checkedIn ? '#ffb4ab' : '#00e5ff'}
                />
                <Text style={[
                  styles.checkInLabel,
                  (checkedIn || isCompletedToday) && styles.checkInLabelActive,
                  !isCompanyWifi && styles.checkInLabelBlocked,
                ]}>
                  {!isCompanyWifi ? 'KHÓA MẠNG' : isCompletedToday ? 'HOÀN THÀNH' : checkedIn ? 'CHECK-OUT' : 'CHECK-IN'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>

          {!isCompanyWifi && (
            <View style={styles.wifiErrorBanner}>
              <MaterialIcons name="lock-clock" size={14} color="#ff4d4f" />
              <Text style={styles.wifiErrorText}>
                Đang dùng "{wifiSSID}" (Mạng ngoài). Vui lòng kết nối Wifi công ty để mở khóa chấm công!
              </Text>
            </View>
          )}

          <Text style={styles.attendanceStatus}>
            {!isCompanyWifi
              ? '🚫 Đã khóa điểm danh do chưa kết nối Wifi công ty'
              : isCompletedToday
              ? 'Đã hoàn thành tất cả các ca hôm nay'
              : checkedIn
              ? `Đã Check-in [${activeShiftName}]${latestInRecord?.time ? ` lúc ${latestInRecord.time}` : ''}`
              : `Bấm để Check-in [${activeShiftName}]`}
          </Text>

          {/* Row 1: Primary Shift / Late Warning Status */}
          {!isCompletedToday && (
            <View style={styles.shiftStatusRow}>
              {checkedIn && isShiftEnded ? (
                <View style={[styles.statusPill, styles.shiftEndedPill]}>
                  <MaterialIcons name="alarm-on" size={13} color="#90caf9" />
                  <Text style={[styles.statusPillText, { color: '#90caf9' }]}>
                    Đã hết ca làm ({shiftEndTime})
                  </Text>
                </View>
              ) : checkedIn && latestInRecord?.status === 'LATE' ? (
                <View style={[styles.statusPill, styles.latePill]}>
                  <MaterialIcons name="warning" size={13} color="#ffb74d" />
                  <Text style={[styles.statusPillText, { color: '#ffb74d' }]}>
                    Check-in lúc {latestInRecord.time} - Muộn {formatMinutesToText(latestInRecord.lateMinutes || 0)}
                  </Text>
                </View>
              ) : !checkedIn && isLateCheckIn ? (
                <View style={[styles.statusPill, styles.latePill]}>
                  <MaterialIcons name="error-outline" size={13} color="#ff8a80" />
                  <Text style={[styles.statusPillText, { color: '#ff8a80' }]}>
                    Điểm danh lúc {timeStr}: Muộn {formatMinutesToText(lateMinutes || 0)}
                  </Text>
                </View>
              ) : !checkedIn ? (
                <View style={styles.statusPill}>
                  <MaterialIcons name="check-circle-outline" size={13} color="#05e777" />
                  <Text style={[styles.statusPillText, { color: '#05e777' }]}>
                    Đúng giờ (Bắt đầu {shiftStartTime})
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Row 2: Wifi & GPS Status Badges Side-by-side */}
          <View style={styles.networkLocationRow}>
            <Pressable onPress={onToggleWifi} style={[styles.statusPill, isCompanyWifi ? styles.wifiPillSuccess : styles.wifiPillError]}>
              <MaterialIcons name={isCompanyWifi ? 'wifi' : 'wifi-off'} size={13} color={isCompanyWifi ? '#00e5ff' : '#ff4d4f'} />
              <Text style={[styles.statusPillText, { color: isCompanyWifi ? '#00e5ff' : '#ff8a80', fontWeight: '600' }]}>
                Wifi: {wifiSSID} {isCompanyWifi ? '(Hợp lệ)' : '(Mạng ngoài)'}
              </Text>
              {onToggleWifi && (
                <MaterialIcons name="swap-horiz" size={13} color={isCompanyWifi ? '#00e5ff' : '#ff8a80'} style={{ marginLeft: 2 }} />
              )}
            </Pressable>

            <View style={styles.statusPill}>
              <MaterialIcons name="location-on" size={13} color="#05e777" />
              <Text style={styles.statusPillText}>GPS: Nội bộ</Text>
            </View>
          </View>

          {/* Lịch sử điểm danh kèm Chú thích */}
          {checkInsHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Lịch sử điểm danh</Text>
              {checkInsHistory.slice(0, 5).map((item) => {
                const shiftName = item.shiftName || 'Ca Sáng';
                let status = item.status;
                let lateMinutes = item.lateMinutes;
                let earlyMinutes = item.earlyMinutes;

                if (!status) {
                  if (item.type === 'in') {
                    const evalRes = evaluateCheckInStatus(shiftName, item.time);
                    status = evalRes.status;
                    lateMinutes = evalRes.lateMinutes;
                  } else {
                    const evalRes = evaluateCheckOutStatus(shiftName, item.time);
                    status = evalRes.status;
                    earlyMinutes = evalRes.earlyMinutes;
                  }
                }

                return (
                  <View key={item.id} style={styles.historyCardItem}>
                    <View style={styles.historyRow}>
                      <MaterialIcons
                        name={item.type === 'in' ? 'login' : 'logout'}
                        size={14}
                        color={item.type === 'in' ? '#05e777' : '#ffb4ab'}
                      />
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: 6 }}>
                        <Text style={[styles.historyText, { flex: 1, marginRight: 6 }]} numberOfLines={1}>
                          <Text style={{ color: item.type === 'in' ? '#05e777' : '#ffb4ab', fontWeight: '700' }}>
                            {item.type === 'in' ? 'Check-in' : 'Check-out'}
                          </Text>
                          {' '}[{shiftName}] lúc <Text style={{ color: '#ffffff', fontWeight: '600' }}>{item.time}</Text> ({formatDateCompact(item.date)})
                        </Text>

                        {status === 'LATE' && (
                          <View style={styles.miniTagLate}>
                            <Text style={styles.miniTagText}>Đi muộn</Text>
                          </View>
                        )}
                        {status === 'EARLY_LEAVE' && (
                          <View style={styles.miniTagEarly}>
                            <Text style={styles.miniTagText}>Về sớm</Text>
                          </View>
                        )}
                        {(status === 'ON_TIME' || status === 'NORMAL') && (
                          <View style={styles.miniTagOnTime}>
                            <Text style={styles.miniTagOnTimeText}>Đúng giờ</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Dòng chú thích chi tiết hiển thị bên dưới khi đi muộn / về sớm hoặc có ghi chú */}
                    {(status === 'LATE' || status === 'EARLY_LEAVE' || (item.note && status !== 'ON_TIME' && status !== 'NORMAL')) && (
                      <View style={styles.annotationBox}>
                        <MaterialIcons
                          name="info-outline"
                          size={12}
                          color={status === 'LATE' ? '#ffb74d' : status === 'EARLY_LEAVE' ? '#ffb74d' : '#00e5ff'}
                        />
                        <Text
                          style={[
                            styles.annotationText,
                            { color: status === 'LATE' ? '#ffb74d' : status === 'EARLY_LEAVE' ? '#ffb74d' : '#849396' },
                          ]}
                          numberOfLines={1}
                        >
                          Chú thích: {
                            status === 'LATE'
                              ? `Đi muộn ${formatMinutesToText(lateMinutes || 0)}`
                              : status === 'EARLY_LEAVE'
                              ? `Về sớm ${formatMinutesToText(earlyMinutes || 0)}`
                              : item.note
                          }
                        </Text>
                      </View>
                    )}

                  </View>
                );
              })}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  timeBanner: {
    backgroundColor: '#151d1e',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.4)',
  },
  timeText: { fontSize: 36, fontWeight: '700', color: '#c3f5ff', letterSpacing: -0.5 },
  dateText: { fontSize: 12, color: '#849396', marginTop: 2 },
  section: { marginBottom: 16 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#dce4e5' },
  shiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,229,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.25)',
  },
  shiftBadgeText: { fontSize: 11, color: '#00e5ff', fontWeight: '600' },
  attendanceCard: {
    backgroundColor: '#192122',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.35)',
    gap: 14,
  },
  buttonContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center', width: 160, height: 160 },
  attendanceGlow: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,229,255,0.05)' },
  attendanceGlowActive: { backgroundColor: 'rgba(5,231,119,0.05)' },
  attendanceGlowBlocked: { backgroundColor: 'rgba(255,77,79,0.05)' },
  fingerprintGlow: { position: 'absolute', width: '100%', height: '100%', borderRadius: 80, backgroundColor: 'rgba(0,229,255,0.1)', borderWidth: 1, borderColor: 'rgba(0,229,255,0.2)' },
  fingerprintGlowActive: { backgroundColor: 'rgba(5,231,119,0.1)', borderColor: 'rgba(5,231,119,0.2)' },
  fingerprintGlowBlocked: { backgroundColor: 'rgba(255,77,79,0.1)', borderColor: 'rgba(255,77,79,0.3)' },
  checkInButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#242b2d',
    borderWidth: 1.5,
    borderColor: 'rgba(0,229,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInButtonActive: { borderColor: 'rgba(5,231,119,0.4)' },
  checkInButtonBlocked: { borderColor: 'rgba(255,77,79,0.5)', backgroundColor: '#2a1a1c' },
  checkInRipple: { position: 'absolute', width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: 'rgba(0,229,255,0.6)' },
  checkInRippleActive: { borderColor: 'rgba(5,231,119,0.6)' },
  checkInRippleBlocked: { borderColor: 'rgba(255,77,79,0.6)' },
  checkInLabel: { fontSize: 11, fontWeight: '700', color: '#00e5ff', letterSpacing: 1.5, marginTop: 6 },
  checkInLabelActive: { color: '#7dffa2' },
  checkInLabelBlocked: { color: '#ff4d4f' },
  wifiErrorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,77,79,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,77,79,0.3)',
    gap: 6,
    width: '100%',
  },
  wifiErrorText: { fontSize: 11, color: '#ff8a80', flex: 1, lineHeight: 16 },
  attendanceStatus: { fontSize: 13, color: '#bac9cc', textAlign: 'center' },
  shiftStatusRow: { alignItems: 'center', width: '100%' },
  networkLocationRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#242b2d', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(59,73,76,0.4)' },
  wifiPillSuccess: { backgroundColor: 'rgba(0,229,255,0.1)', borderColor: 'rgba(0,229,255,0.3)' },
  wifiPillError: { backgroundColor: 'rgba(255,77,79,0.15)', borderColor: 'rgba(255,77,79,0.4)' },
  latePill: { backgroundColor: 'rgba(255,152,0,0.12)', borderColor: 'rgba(255,152,0,0.3)' },
  shiftEndedPill: { backgroundColor: 'rgba(33,150,243,0.12)', borderColor: 'rgba(33,150,243,0.3)' },
  statusPillText: { fontSize: 11, color: '#bac9cc' },
  historyContainer: { width: '100%', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(59,73,76,0.3)' },
  historyTitle: { fontSize: 11, fontWeight: '600', color: '#849396', marginBottom: 8, textTransform: 'uppercase' },
  historyCardItem: {
    backgroundColor: '#151d1e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.25)',
  },
  historyRow: { flexDirection: 'row', alignItems: 'center' },
  historyText: { fontSize: 11, color: '#bac9cc' },
  miniTagLate: { backgroundColor: 'rgba(255,77,79,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniTagEarly: { backgroundColor: 'rgba(255,152,0,0.2)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniTagOnTime: { backgroundColor: 'rgba(5,231,119,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  miniTagText: { fontSize: 10, color: '#ffb4ab', fontWeight: '600' },
  miniTagOnTimeText: { fontSize: 10, color: '#7dffa2', fontWeight: '600' },
  annotationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  annotationText: { fontSize: 10, color: '#ffb74d', fontStyle: 'italic', flex: 1 },
});
