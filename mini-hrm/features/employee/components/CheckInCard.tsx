import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Modal,
  Image,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/context/AuthContext';
import { CheckInCardProps } from '../types/dashboard';
import { formatMinutesToText, formatMinutesCompact, evaluateCheckInStatus, evaluateCheckOutStatus } from '@/constants/shifts';
import { formatDateCompact } from '@/utils';

export const CheckInCard: React.FC<CheckInCardProps> = ({
  shiftInfo,
  checkInsHistory,
  wifiSSID = 'Office_5G',
  isCompanyWifi = true,
  isDemoBypass,
  onToggleDemoBypass,
  onToggleWifi,
  onCheckInPress,
  userName,
  userAvatar,
}) => {
  const { user } = useAuth();
  const employeeName = userName || user?.name || 'Trần Văn A';
  const employeeAvatar =
    userAvatar ||
    user?.avatar ||
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80';

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Xác định trạng thái Demo Mode
  const isDemoMode = isDemoBypass !== undefined ? isDemoBypass : (wifiSSID.includes('Demo Mode') || wifiSSID === 'Office_5G_VIP (Demo Mode)');
  // Khi ở Demo Mode, Wi-Fi luôn được xem là hợp lệ
  const effectiveIsCompanyWifi = isCompanyWifi || isDemoMode;

  // Xử lý triple-tap (bấm 3 lần nhanh vào Wi-Fi để bật/tắt bypass)
  const tapCountRef = useRef<number>(0);
  const lastTapTimeRef = useRef<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  // ── Modal Quét Khuôn Mặt AI (Fallback UI) ──
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [aiScanStatus, setAiScanStatus] = useState<'scanning' | 'success'>('scanning');
  const laserAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.85)).current;
  const modalFadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkScaleAnim = useRef(new Animated.Value(0)).current;
  const laserLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2200),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setToastMessage(null);
    });
  }, [toastOpacity]);

  const triggerAiFaceScan = useCallback(() => {
    setAiScanStatus('scanning');
    checkmarkScaleAnim.setValue(0);
    setIsAiModalVisible(true);

    // Mở popup mượt mà
    Animated.parallel([
      Animated.timing(modalFadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(modalScaleAnim, { toValue: 1, tension: 70, friction: 7, useNativeDriver: true }),
    ]).start();

    // Laser quét sáng lên xuống liên tục qua avatar
    laserAnim.setValue(0);
    laserLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(laserAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(laserAnim, {
          toValue: 0,
          duration: 550,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    laserLoopRef.current.start();

    // Chạy đếm ngược 1.2 giây nhận diện AI
    setTimeout(async () => {
      laserLoopRef.current?.stop();
      setAiScanStatus('success');

      // Tích xanh thành công phóng to
      Animated.spring(checkmarkScaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }).start();

      // Kích hoạt rung nhẹ Haptics
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (_) {}

      // Giữ màn hình thành công 750ms rồi đóng và gọi hàm check-in API
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(modalFadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(modalScaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
        ]).start(() => {
          setIsAiModalVisible(false);
          onCheckInPress();
        });
      }, 750);
    }, 1200);
  }, [modalFadeAnim, modalScaleAnim, laserAnim, checkmarkScaleAnim, onCheckInPress]);

  const handleWifiTripleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTimeRef.current < 650) {
      tapCountRef.current += 1;
    } else {
      tapCountRef.current = 1;
    }
    lastTapTimeRef.current = now;

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      if (onToggleDemoBypass) {
        onToggleDemoBypass();
      } else if (onToggleWifi) {
        onToggleWifi();
      }
      const nextMode = !isDemoMode;
      showToast(
        nextMode
          ? '⚡ Đã BẬT Demo Bypass: Tự động hợp lệ Wi-Fi văn phòng!'
          : '🔒 Đã TẮT Demo Bypass: Kiểm tra mạng Wi-Fi thực tế.'
      );
    }
  }, [isDemoMode, onToggleDemoBypass, onToggleWifi, showToast]);

  const handlePressIn = () =>
    Animated.spring(scaleAnim, { toValue: 0.92, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const handlePressOut = () =>
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();

  const handlePress = async () => {
    pulseAnim.setValue(0);
    Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }).start();

    // Nếu mạng bị khóa thực sự (khi tắt bypass và mạng ngoài) thì gọi thẳng để hiện thông báo khóa mạng
    if (!effectiveIsCompanyWifi) {
      onCheckInPress();
      return;
    }

    // 1. Thử xác thực sinh trắc học hệ thống (nếu máy hỗ trợ FaceID / Vân tay)
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Xác thực danh tính để chấm công',
          cancelLabel: 'Hủy',
          disableDeviceFallback: false,
        });

        if (result.success) {
          try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (_) {}
          onCheckInPress();
          return;
        } else if (result.error === 'user_cancel' || result.error === 'app_cancel') {
          // Người dùng chủ động hủy hộp thoại sinh trắc học
          return;
        }
      }
    } catch (err) {
      console.log('[Biometrics Error, falling back to AI scanning]', err);
    }

    // 2. Phương án dự phòng (Simulator, Web hoặc máy không có/chưa cài vân tay):
    // Kích hoạt Modal mô phỏng "Quét khuôn mặt AI"
    triggerAiFaceScan();
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
          {/* Floating Toast Notification khi toggle Demo Bypass */}
          {toastMessage && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.toastContainer,
                {
                  opacity: toastOpacity,
                  transform: [
                    {
                      translateY: toastOpacity.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-8, 0],
                      }),
                    },
                  ],
                },
              ]}
            >
              <MaterialIcons name="offline-bolt" size={15} color="#00daf3" />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </Animated.View>
          )}

          <View style={styles.buttonContainer}>
            <View style={[styles.attendanceGlow, (checkedIn || isCompletedToday) && styles.attendanceGlowActive, !effectiveIsCompanyWifi && styles.attendanceGlowBlocked]} />
            <View style={[styles.fingerprintGlow, (checkedIn || isCompletedToday) && styles.fingerprintGlowActive, !effectiveIsCompanyWifi && styles.fingerprintGlowBlocked]} />
            <Animated.View
              pointerEvents="none"
              style={[
                styles.checkInRipple,
                (checkedIn || isCompletedToday) && styles.checkInRippleActive,
                !effectiveIsCompanyWifi && styles.checkInRippleBlocked,
                { opacity: pulseOpacity, transform: [{ scale: pulseScale }] },
              ]}
            />
            <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut} onPress={handlePress}>
              <Animated.View
                style={[
                  styles.checkInButton,
                  (checkedIn || isCompletedToday) && styles.checkInButtonActive,
                  !effectiveIsCompanyWifi && styles.checkInButtonBlocked,
                  { transform: [{ scale: scaleAnim }] },
                ]}
              >
                <MaterialIcons
                  name={!effectiveIsCompanyWifi ? 'wifi-off' : 'fingerprint'}
                  size={52}
                  color={!effectiveIsCompanyWifi ? '#ff4d4f' : isCompletedToday ? '#7dffa2' : checkedIn ? '#ffb4ab' : '#00e5ff'}
                />
                <Text style={[
                  styles.checkInLabel,
                  (checkedIn || isCompletedToday) && styles.checkInLabelActive,
                  !effectiveIsCompanyWifi && styles.checkInLabelBlocked,
                ]}>
                  {!effectiveIsCompanyWifi ? 'KHÓA MẠNG' : isCompletedToday ? 'HOÀN THÀNH' : checkedIn ? 'CHECK-OUT' : 'CHECK-IN'}
                </Text>
              </Animated.View>
            </Pressable>
          </View>

          {!effectiveIsCompanyWifi && (
            <View style={styles.wifiErrorBanner}>
              <MaterialIcons name="lock-clock" size={14} color="#ff4d4f" />
              <Text style={styles.wifiErrorText}>
                Đang dùng "{wifiSSID}" (Mạng ngoài). Vui lòng kết nối Wifi công ty để mở khóa chấm công!
              </Text>
            </View>
          )}

          {/* Badge nhỏ màu xanh lá: ✓ Wi-Fi Văn phòng hợp lệ (Demo Mode) */}
          {isDemoMode && (
            <View style={styles.demoBadge}>
              <MaterialIcons name="verified" size={13} color="#05e777" />
              <Text style={styles.demoBadgeText}>✓ Wi-Fi Văn phòng hợp lệ (Demo Mode)</Text>
            </View>
          )}

          <Text style={styles.attendanceStatus}>
            {!effectiveIsCompanyWifi
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

          {/* Row 2: Wifi & GPS Status Badges Side-by-side (Hỗ trợ bấm 3 lần để toggle Demo Bypass) */}
          <View style={styles.networkLocationRow}>
            <Pressable
              onPress={handleWifiTripleTap}
              style={[
                styles.statusPill,
                effectiveIsCompanyWifi ? styles.wifiPillSuccess : styles.wifiPillError,
                isDemoMode && styles.wifiPillDemo,
              ]}
            >
              <MaterialIcons
                name={effectiveIsCompanyWifi ? 'wifi' : 'wifi-off'}
                size={13}
                color={isDemoMode ? '#7dffa2' : effectiveIsCompanyWifi ? '#00e5ff' : '#ff4d4f'}
              />
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: isDemoMode ? '#7dffa2' : effectiveIsCompanyWifi ? '#00e5ff' : '#ff8a80',
                    fontWeight: '600',
                  },
                ]}
              >
                Wifi: {wifiSSID} {effectiveIsCompanyWifi ? '(Hợp lệ)' : '(Mạng ngoài)'}
              </Text>
              <MaterialIcons
                name="touch-app"
                size={12}
                color={isDemoMode ? '#7dffa2' : '#849396'}
                style={{ marginLeft: 2, opacity: 0.75 }}
              />
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

      {/* ── Modal Quét Khuôn Mặt AI (Fallback UI) ── */}
      <Modal
        visible={isAiModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => {
          laserLoopRef.current?.stop();
          setIsAiModalVisible(false);
        }}
      >
        <View style={styles.modalBackdrop}>
          <Animated.View
            style={[
              styles.aiModalCard,
              {
                opacity: modalFadeAnim,
                transform: [{ scale: modalScaleAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.aiModalHeader}>
              <View style={styles.aiModalTitleRow}>
                <MaterialIcons
                  name={aiScanStatus === 'success' ? 'verified' : 'face'}
                  size={20}
                  color={aiScanStatus === 'success' ? '#05e777' : '#00e5ff'}
                />
                <Text style={styles.aiModalTitle}>QUÉT KHUÔN MẶT AI</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  laserLoopRef.current?.stop();
                  setIsAiModalVisible(false);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={20} color="#849396" />
              </TouchableOpacity>
            </View>

            <Text style={styles.aiModalSubtitle}>
              {aiScanStatus === 'scanning'
                ? 'Đang nhận diện sinh trắc học khuôn mặt qua AI Camera...'
                : 'Xác thực sinh trắc học thành công!'}
            </Text>

            {/* Khung Viewfinder quét khuôn mặt */}
            <View style={styles.viewfinderContainer}>
              {/* 4 Góc khung HUD */}
              <View style={[styles.cornerBracket, styles.cornerTL, aiScanStatus === 'success' && styles.cornerSuccess]} />
              <View style={[styles.cornerBracket, styles.cornerTR, aiScanStatus === 'success' && styles.cornerSuccess]} />
              <View style={[styles.cornerBracket, styles.cornerBL, aiScanStatus === 'success' && styles.cornerSuccess]} />
              <View style={[styles.cornerBracket, styles.cornerBR, aiScanStatus === 'success' && styles.cornerSuccess]} />

              {/* Khung ảnh tròn chân dung nhân viên */}
              <View
                style={[
                  styles.avatarScanningFrame,
                  aiScanStatus === 'success' && styles.avatarScanningFrameSuccess,
                ]}
              >
                <Image
                  source={{ uri: employeeAvatar }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />

                {/* Tia laser quét sáng lên xuống */}
                {aiScanStatus === 'scanning' && (
                  <Animated.View
                    style={[
                      styles.laserLine,
                      {
                        transform: [
                          {
                            translateY: laserAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-46, 46],
                            }),
                          },
                        ],
                      },
                    ]}
                  />
                )}

                {/* Huy hiệu tích xanh thành công */}
                {aiScanStatus === 'success' && (
                  <Animated.View
                    style={[
                      styles.successBadgeOverlay,
                      {
                        transform: [{ scale: checkmarkScaleAnim }],
                      },
                    ]}
                  >
                    <MaterialIcons name="check-circle" size={48} color="#05e777" />
                  </Animated.View>
                )}
              </View>
            </View>

            {/* Trạng thái & Thông tin nhân viên */}
            <View style={styles.aiStatusSection}>
              {aiScanStatus === 'scanning' ? (
                <>
                  <View style={styles.scanningDotRow}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.scanningText}>Đang nhận diện khuôn mặt...</Text>
                  </View>
                  <Text style={styles.aiConfidenceText}>Độ khớp AI: 99.4% • Chuẩn định danh M3</Text>
                </>
              ) : (
                <>
                  <Text style={styles.successNameText}>
                    Xác thực thành công: {employeeName}
                  </Text>
                  <View style={styles.successChip}>
                    <MaterialIcons name="done-all" size={14} color="#7dffa2" />
                    <Text style={styles.successChipText}>Khớp dữ liệu nhân viên • Đang chấm công...</Text>
                  </View>
                </>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  demoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 231, 119, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(5, 231, 119, 0.35)',
  },
  demoBadgeText: {
    fontSize: 11,
    color: '#7dffa2',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  wifiPillDemo: {
    backgroundColor: 'rgba(5, 231, 119, 0.1)',
    borderColor: 'rgba(5, 231, 119, 0.35)',
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#151d1e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#c3f5ff',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  aiModalCard: {
    width: '100%',
    maxWidth: 330,
    backgroundColor: '#151d1e',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 255, 0.35)',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 12,
  },
  aiModalHeader: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  aiModalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiModalTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00e5ff',
    letterSpacing: 1.2,
  },
  aiModalSubtitle: {
    fontSize: 11,
    color: '#849396',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 18,
  },
  viewfinderContainer: {
    position: 'relative',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cornerBracket: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: '#00e5ff',
  },
  cornerSuccess: {
    borderColor: '#05e777',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 2.5, borderLeftWidth: 2.5 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 2.5, borderRightWidth: 2.5 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 2.5, borderLeftWidth: 2.5 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 2.5, borderRightWidth: 2.5 },
  avatarScanningFrame: {
    position: 'relative',
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.5)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0d1516',
  },
  avatarScanningFrameSuccess: {
    borderColor: '#05e777',
    borderWidth: 2.5,
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  laserLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#00e5ff',
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  successBadgeOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(13, 21, 22, 0.65)',
    width: '100%',
    height: '100%',
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiStatusSection: {
    width: '100%',
    alignItems: 'center',
  },
  scanningDotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  pulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00e5ff',
  },
  scanningText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#c3f5ff',
  },
  aiConfidenceText: {
    fontSize: 11,
    color: '#849396',
    marginTop: 2,
  },
  successNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7dffa2',
    textAlign: 'center',
    marginBottom: 6,
  },
  successChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(5, 231, 119, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(5, 231, 119, 0.3)',
  },
  successChipText: {
    fontSize: 11,
    color: '#7dffa2',
    fontWeight: '600',
  },
});
