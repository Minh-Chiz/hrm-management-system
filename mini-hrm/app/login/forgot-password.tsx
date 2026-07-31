import React from 'react';
import {
  View,
  Text,
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { forgotPasswordSchema, ForgotPasswordFormData } from '@/schemas/authSchema';

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const { control, handleSubmit } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const onSubmit = (data: ForgotPasswordFormData) => {
    Alert.alert(
      'Thành công',
      `Liên kết đặt lại mật khẩu đã được gửi đến email ${data.email}!`,
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
            <ControlledInput<ForgotPasswordFormData>
              name="email"
              control={control}
              label="Email"
              placeholder="Nhập email của bạn"
              icon="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />

            {/* Action button */}
            <View className="w-full">
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
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
