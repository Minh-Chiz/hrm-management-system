import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AlertBox } from '@/components/ui/AlertBox';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleSendRequest = () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Vui lòng nhập email.');
      return;
    }

    if (!trimmedEmail.includes('@')) {
      setError('Định dạng email không hợp lệ.');
      return;
    }

    setError('');
    setSuccess(true);

    Alert.alert(
      'Thành công',
      'Liên kết đặt lại mật khẩu đã được gửi đến email của bạn!',
      [
        {
          text: 'OK',
          onPress: handleBack,
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
        >
          {/* Header (Top App Bar) */}
          <View className="flex-row items-center justify-between px-6 h-14 relative w-full mt-2">
            <TouchableOpacity
              onPress={handleBack}
              className="active:scale-95 transition-all p-2 absolute left-4 z-10"
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={24} color="#dce4e5" />
            </TouchableOpacity>
            <View className="flex-1 items-center justify-center">
              <Text className="text-brand-on-surface text-lg font-bold tracking-wider text-center">
                QUÊN MẬT KHẨU
              </Text>
            </View>
          </View>

          {/* Body content */}
          <View className="flex-1 px-6 pt-6 justify-start">
            <Text className="text-brand-on-surface-variant text-base text-center mb-8 leading-6">
              Vui lòng nhập email đã đăng ký để khôi phục mật khẩu.
            </Text>

            {/* Email input field */}
            <View className="mb-6 w-full">
              <Text className="text-brand-on-surface text-sm font-semibold mb-2 pl-1">
                Email
              </Text>
              <View className="flex-row items-center bg-brand-card rounded-lg border border-brand-outline-variant px-4 h-14 w-full">
                <View className="mr-3">
                  <MaterialIcons name="mail-outline" size={20} color="#849396" />
                </View>
                <TextInput
                  className="flex-1 text-brand-on-surface text-base h-full"
                  placeholder="Nhập email của bạn"
                  placeholderTextColor="#849396"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSendRequest}
                />
              </View>
            </View>

            {/* Error message */}
            {error ? (
              <View className="mb-6 w-full">
                <AlertBox message={error} />
              </View>
            ) : null}

            {/* Action button */}
            <View className="w-full">
              <TouchableOpacity
                onPress={handleSendRequest}
                className="w-full h-14 bg-brand-neon rounded-xl items-center justify-center active:scale-95 transition-all"
                activeOpacity={0.7}
              >
                <Text className="text-[#001f24] text-base font-bold tracking-wide">
                  GỬI YÊU CẦU
                </Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Link */}
            <View className="flex-row justify-center items-center mt-auto py-10">
              <TouchableOpacity
                onPress={handleBack}
                className="active:scale-95 transition-all"
                activeOpacity={0.7}
              >
                <Text className="text-brand-neon text-base font-semibold">
                  Quay lại Đăng nhập
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
});
