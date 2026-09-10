import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COMPANY_WIFIS, isCompanyWifiSSID } from '@/constants/network';

const DEMO_BYPASS_STORAGE_KEY = '@hrm_wifi_demo_bypass';
const DEMO_WIFI_NAME = 'Office_5G_VIP (Demo Mode)';

export function useWifiCheck(initialDemoBypass: boolean = true) {
  const [isDemoBypass, setIsDemoBypass] = useState<boolean>(initialDemoBypass);
  const [rawWifiSSID, setRawWifiSSID] = useState<string>('Office_5G');

  // Khôi phục tùy chọn bypass đã lưu (nếu có)
  useEffect(() => {
    AsyncStorage.getItem(DEMO_BYPASS_STORAGE_KEY)
      .then((stored) => {
        if (stored !== null) {
          setIsDemoBypass(stored === 'true');
        }
      })
      .catch(() => {});
  }, []);

  const toggleDemoBypass = useCallback(() => {
    setIsDemoBypass((prev) => {
      const next = !prev;
      AsyncStorage.setItem(DEMO_BYPASS_STORAGE_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const setDemoBypass = useCallback((val: boolean) => {
    setIsDemoBypass(val);
    AsyncStorage.setItem(DEMO_BYPASS_STORAGE_KEY, String(val)).catch(() => {});
  }, []);

  // Khi isDemoBypass === true: luôn trả về tên Wi-Fi demo và coi như đã kết nối Wi-Fi công ty
  const wifiSSID = isDemoBypass ? DEMO_WIFI_NAME : rawWifiSSID;
  const isConnectedToCompanyWifi = isDemoBypass ? true : isCompanyWifiSSID(rawWifiSSID);
  const isCompanyWifi = isConnectedToCompanyWifi;

  // Toggle giữa Wi-Fi công ty và mạng ngoài khi thử nghiệm thủ công
  const toggleWifiSimulation = useCallback(() => {
    setRawWifiSSID((prev) => (isCompanyWifiSSID(prev) ? 'Home_Wifi_Guest' : COMPANY_WIFIS[0]));
  }, []);

  return {
    wifiSSID,
    isCompanyWifi,
    isConnectedToCompanyWifi,
    isDemoBypass,
    setIsDemoBypass: setDemoBypass,
    toggleDemoBypass,
    setWifiSSID: setRawWifiSSID,
    toggleWifiSimulation,
    allowedWifis: COMPANY_WIFIS,
  };
}
