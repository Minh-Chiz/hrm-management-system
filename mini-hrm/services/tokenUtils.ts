import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = '@hrm_auth_token';
export const REFRESH_TOKEN_STORAGE_KEY = '@hrm_refresh_token';

export const getAuthToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch (e) {
    console.error('Failed to save auth token:', e);
  }
};

export const removeAuthToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove auth token:', e);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setRefreshToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
  } catch (e) {
    console.error('Failed to save refresh token:', e);
  }
};

export const removeRefreshToken = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to remove refresh token:', e);
  }
};

export const clearTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
      AsyncStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY),
    ]);
  } catch (e) {
    console.error('Failed to clear tokens:', e);
  }
};
