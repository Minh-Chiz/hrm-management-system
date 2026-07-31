import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface EarlyCheckOutModalProps {
  visible: boolean;
  shiftName: string;
  shiftEndTime: string;
  remainingText: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export const EarlyCheckOutModal: React.FC<EarlyCheckOutModalProps> = ({
  visible,
  shiftName,
  shiftEndTime,
  remainingText,
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header Icon */}
          <View style={styles.iconContainer}>
            <MaterialIcons name="warning-amber" size={38} color="#ff9800" />
          </View>

          {/* Content */}
          <Text style={styles.title}>Cảnh Báo Check-out Giữa Ca</Text>
          
          <Text style={styles.message}>
            Ca làm việc <Text style={styles.highlight}>[{shiftName}]</Text> chưa kết thúc (cần làm tới <Text style={styles.highlight}>{shiftEndTime}</Text>).
          </Text>

          <View style={styles.timeBox}>
            <MaterialIcons name="schedule" size={18} color="#ffb74d" />
            <Text style={styles.timeBoxText}>
              Còn <Text style={styles.timeHighlight}>{remainingText}</Text> nữa mới hết ca làm
            </Text>
          </View>

          <Text style={styles.subtext}>
            Bạn có chắc chắn muốn Check-out trước thời hạn không? Hành động này sẽ được hệ thống ghi nhận là <Text style={{ color: '#ffb4ab', fontWeight: '700' }}>Về sớm</Text>.
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <Pressable style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
              <Text style={styles.cancelBtnText}>HỦY BỎ</Text>
            </Pressable>

            <Pressable style={[styles.btn, styles.confirmBtn]} onPress={onConfirm}>
              <Text style={styles.confirmBtnText}>XÁC NHẬN CHECK-OUT</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1a2224',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,152,0,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffe0b2',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#dce4e5',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 12,
  },
  highlight: {
    fontWeight: '700',
    color: '#ffe0b2',
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,152,0,0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.25)',
    marginBottom: 14,
    gap: 8,
  },
  timeBoxText: {
    fontSize: 13,
    color: '#ffe0b2',
  },
  timeHighlight: {
    fontWeight: '700',
    color: '#ffb74d',
  },
  subtext: {
    fontSize: 12,
    color: '#849396',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    backgroundColor: '#2b3436',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#bac9cc',
  },
  confirmBtn: {
    backgroundColor: '#d32f2f',
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});
