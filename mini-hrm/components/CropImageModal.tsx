import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CROP_SIZE = Math.min(SCREEN_WIDTH - 64, 260);

interface CropImageModalProps {
  visible: boolean;
  imageUri: string | null;
  onClose: () => void;
  onCropComplete: (croppedUri: string) => void;
  onPickAnotherImage: () => void;
}

export function CropImageModal({
  visible,
  imageUri,
  onClose,
  onCropComplete,
  onPickAnotherImage,
}: CropImageModalProps) {
  const insets = useSafeAreaInsets();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  const panOffsetRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: 0, y: 0 });
  positionRef.current = position;

  useEffect(() => {
    if (visible && imageUri) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      panOffsetRef.current = { x: 0, y: 0 };
      
      const isValidUriScheme =
        typeof imageUri === 'string' &&
        (imageUri.startsWith('http://') ||
          imageUri.startsWith('https://') ||
          imageUri.startsWith('file://') ||
          imageUri.startsWith('content://') ||
          imageUri.startsWith('data:'));

      if (isValidUriScheme) {
        Image.getSize(
          imageUri,
          (w, h) => {
            setImageSize({ width: w, height: h });
          },
          () => {
            setImageSize({ width: 800, height: 800 });
          }
        );
      } else {
        setImageSize({ width: 800, height: 800 });
      }
    }
  }, [visible, imageUri]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        panOffsetRef.current = { ...positionRef.current };
      },
      onPanResponderMove: (_, gestureState) => {
        setPosition({
          x: panOffsetRef.current.x + gestureState.dx,
          y: panOffsetRef.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleCrop = async () => {
    if (!imageUri) return;
    setIsProcessing(true);

    try {
      const actions: ImageManipulator.Action[] = [];

      if (rotation !== 0) {
        actions.push({ rotate: rotation });
      }

      const origW = imageSize?.width || 800;
      const origH = imageSize?.height || 800;

      const minDimension = Math.min(origW, origH);
      const cropW = Math.max(50, Math.round(minDimension / scale));
      const cropH = cropW;

      const displayScaleRatio = origW / CROP_SIZE;
      const offsetX = Math.round((origW - cropW) / 2 - position.x * displayScaleRatio);
      const offsetY = Math.round((origH - cropH) / 2 - position.y * displayScaleRatio);

      const originX = Math.max(0, Math.min(origW - cropW, offsetX));
      const originY = Math.max(0, Math.min(origH - cropH, offsetY));

      actions.push({
        crop: {
          originX,
          originY,
          width: cropW,
          height: cropH,
        },
      });

      actions.push({
        resize: { width: 400, height: 400 },
      });

      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        actions,
        { compress: 0.9, format: ImageManipulator.SaveFormat.PNG }
      );

      setIsProcessing(false);
      onCropComplete(result.uri);
    } catch (error) {
      console.error('Image crop error:', error);
      setIsProcessing(false);
      onCropComplete(imageUri);
    }
  };

  if (!visible || !imageUri) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 16) }]}>
          <TouchableOpacity style={styles.iconBtn} onPress={onClose} disabled={isProcessing}>
            <MaterialIcons name="close" size={22} color="#bac9cc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa & Cắt ảnh</Text>
          <TouchableOpacity style={styles.pickOtherBtn} onPress={onPickAnotherImage} disabled={isProcessing}>
            <MaterialIcons name="photo-library" size={16} color="#00e5ff" />
            <Text style={styles.pickOtherText}>Đổi ảnh</Text>
          </TouchableOpacity>
        </View>

        {/* Cropper Workspace */}
        <View style={styles.cropperWorkspace}>
          <Text style={styles.instructionText}>
            Di chuyển & Phóng to/Thu nhỏ để căn vừa khung tròn
          </Text>

          <View style={styles.cropContainer}>
            {/* Background Image Container */}
            <View style={styles.imageWrapper} {...panResponder.panHandlers}>
              <Image
                source={{ uri: imageUri }}
                style={[
                  styles.previewImage,
                  {
                    transform: [
                      { translateX: position.x },
                      { translateY: position.y },
                      { scale: scale },
                      { rotate: `${rotation}deg` },
                    ],
                  },
                ]}
                resizeMode="contain"
              />
            </View>

            {/* Circular Crop Mask Overlay */}
            <View style={styles.cropMaskOverlay} pointerEvents="none">
              <View style={styles.maskOutsideTop} />
              <View style={styles.maskMiddleRow}>
                <View style={styles.maskOutsideSide} />
                <View style={styles.cropCircleFrame}>
                  <View style={styles.circleBorder} />
                  <View style={styles.gridLineV} />
                  <View style={styles.gridLineH} />
                </View>
                <View style={styles.maskOutsideSide} />
              </View>
              <View style={styles.maskOutsideBottom} />
            </View>
          </View>

          {/* Quick Adjustment Toolbar */}
          <View style={styles.toolbar}>
            <TouchableOpacity style={styles.toolBtn} onPress={handleZoomOut} activeOpacity={0.7}>
              <MaterialIcons name="zoom-out" size={22} color="#00e5ff" />
              <Text style={styles.toolLabel}>Thu nhỏ</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleZoomIn} activeOpacity={0.7}>
              <MaterialIcons name="zoom-in" size={22} color="#00e5ff" />
              <Text style={styles.toolLabel}>Phóng to</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleRotate} activeOpacity={0.7}>
              <MaterialIcons name="rotate-right" size={22} color="#00e5ff" />
              <Text style={styles.toolLabel}>Xoay 90°</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolBtn} onPress={handleReset} activeOpacity={0.7}>
              <MaterialIcons name="restart-alt" size={22} color="#849396" />
              <Text style={styles.toolLabel}>Đặt lại</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isProcessing}>
            <Text style={styles.cancelBtnText}>Hủy bỏ</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.applyBtn, isProcessing && styles.btnDisabled]}
            onPress={handleCrop}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#00363d" />
            ) : (
              <>
                <MaterialIcons name="crop-free" size={18} color="#00363d" />
                <Text style={styles.applyBtnText}>Áp dụng cắt ảnh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#0d1516',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#151d1e',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(59,73,76,0.3)',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#dce4e5',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#192122',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickOtherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,229,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,229,255,0.3)',
  },
  pickOtherText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00e5ff',
  },
  cropperWorkspace: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  instructionText: {
    fontSize: 12,
    color: '#849396',
    marginBottom: 16,
    textAlign: 'center',
  },
  cropContainer: {
    width: SCREEN_WIDTH - 32,
    height: SCREEN_WIDTH - 32,
    maxHeight: 340,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: CROP_SIZE,
    height: CROP_SIZE,
  },
  cropMaskOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  maskOutsideTop: {
    flex: 1,
    backgroundColor: 'rgba(13, 21, 22, 0.75)',
  },
  maskMiddleRow: {
    height: CROP_SIZE,
    flexDirection: 'row',
  },
  maskOutsideSide: {
    flex: 1,
    backgroundColor: 'rgba(13, 21, 22, 0.75)',
  },
  cropCircleFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 2,
    borderColor: '#00e5ff',
    overflow: 'hidden',
    position: 'relative',
  },
  circleBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: CROP_SIZE / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gridLineV: {
    position: 'absolute',
    left: CROP_SIZE / 2,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  gridLineH: {
    position: 'absolute',
    top: CROP_SIZE / 2,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 229, 255, 0.2)',
  },
  maskOutsideBottom: {
    flex: 1,
    backgroundColor: 'rgba(13, 21, 22, 0.75)',
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 20,
    backgroundColor: '#151d1e',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.3)',
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  toolLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#bac9cc',
  },
  bottomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#151d1e',
    borderTopWidth: 1,
    borderTopColor: 'rgba(59,73,76,0.3)',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#192122',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(59,73,76,0.5)',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#849396',
  },
  applyBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#00e5ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00363d',
  },
});
