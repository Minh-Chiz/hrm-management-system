export const COMPANY_WIFIS = [
  'Office_5G',
  'HRM_Corporate_Wifi',
  'Tech_Office_Floor5',
];

export function isCompanyWifiSSID(ssid: string): boolean {
  if (!ssid) return false;
  return COMPANY_WIFIS.some(
    (allowed) => allowed.toLowerCase() === ssid.trim().toLowerCase()
  );
}
