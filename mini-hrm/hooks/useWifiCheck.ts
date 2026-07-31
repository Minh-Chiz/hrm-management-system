import { useState, useCallback } from 'react';
import { COMPANY_WIFIS, isCompanyWifiSSID } from '@/constants/network';

export function useWifiCheck() {
  // Default to company wifi 'Office_5G'
  const [wifiSSID, setWifiSSID] = useState<string>('Office_5G');

  const isCompanyWifi = isCompanyWifiSSID(wifiSSID);

  // Toggle between valid company wifi and external wifi for simulation/testing
  const toggleWifiSimulation = useCallback(() => {
    setWifiSSID((prev) => (isCompanyWifiSSID(prev) ? 'Home_Wifi_Guest' : COMPANY_WIFIS[0]));
  }, []);

  return {
    wifiSSID,
    isCompanyWifi,
    setWifiSSID,
    toggleWifiSimulation,
    allowedWifis: COMPANY_WIFIS,
  };
}
