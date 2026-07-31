import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_STORAGE_KEY = '@hrm_auth_token';

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
