/**
 * Application API Configuration & Switch
 * 
 * HƯỚNG DẪN CHUYỂN ĐỔI CHẾ ĐỘ THẬT / GIẢ:
 * 1. Khi đang phát triển Front-end (chưa có Back-end):
 *    - Giữ `USE_MOCK_DATA = true`
 * 
 * 2. Khi Back-end REST API hoàn thiện và sẵn sàng kết nối:
 *    - Chuyển `USE_MOCK_DATA = false`
 *    - Thay đổi `BASE_URL` trỏ tới domain server API thực tế (Ví dụ: 'https://api.mycompany.com/v1')
 */
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Tự động xác định địa chỉ IP máy tính khi kết nối qua Expo Go trên điện thoại thật / máy ảo
 */
const getBaseUrl = (): string => {
  if (Platform.OS === 'web') {
    return 'http://localhost:5000/api';
  }

  // Tự động lấy IP của máy tính từ Metro Bundler khi dùng Expo Go
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest2?.extra?.expoGo?.developer?.inputs?.host;
  if (hostUri) {
    const hostIp = hostUri.split(':')[0];
    return `http://${hostIp}:5000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  USE_MOCK_DATA: false,
  TIMEOUT_MS: 10000,
};
