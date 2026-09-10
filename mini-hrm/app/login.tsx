import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertBox } from '@/components/ui/AlertBox';
import { ControlledInput } from '@/components/ui/ControlledInput';
import { useAuth } from '@/context/AuthContext';
import { loginSchema, LoginFormData } from '@/schemas/authSchema';

interface DemoAccount {
  id: 'admin' | 'teamlead' | 'employee';
  badge: string;
  roleName: string;
  companyCode: string;
  username: string;
  password: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  subtitle: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'admin',
    badge: '👑 Admin (HR)',
    roleName: 'Quản trị viên',
    companyCode: 'VP',
    username: 'admin',
    password: 'admin123',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    textColor: '#fbbf24',
    subtitle: 'admin / admin123',
  },
  {
    id: 'teamlead',
    badge: '⚡ Team Lead',
    roleName: 'Trưởng nhóm',
    companyCode: 'VP',
    username: 'leader',
    password: 'leader123',
    borderColor: 'rgba(0, 229, 255, 0.4)',
    bgColor: 'rgba(0, 229, 255, 0.08)',
    textColor: '#00e5ff',
    subtitle: 'leader / leader123',
  },
  {
    id: 'employee',
    badge: '👤 Nhân viên',
    roleName: 'Nhân viên',
    companyCode: 'VP',
    username: 'nhanvien',
    password: 'user123',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    textColor: '#34d399',
    subtitle: 'nhanvien / user123',
  },
];

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string | null>(null);

  const { control, handleSubmit, setValue } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      companyCode: '',
      username: '',
      password: '',
    },
  });

  // useWatch chỉ subscribe đúng các field cần, không re-render toàn bộ form mỗi keystroke
  const [companyCodeVal, usernameVal, passwordVal] = useWatch({
    control,
    name: ['companyCode', 'username', 'password'],
  });
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [companyCodeVal, usernameVal, passwordVal, clearError]);

  const onSubmit = useCallback((data: LoginFormData) => {
    login(data.companyCode, data.username, data.password);
  }, [login]);

  const handleTogglePassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleQuickDemoLogin = useCallback(
    async (account: DemoAccount) => {
      if (isLoading) return;
      setSelectedDemoRole(account.id);

      // 1. Tự động điền dữ liệu vào form & validate
      setValue('companyCode', account.companyCode, { shouldValidate: true });
      setValue('username', account.username, { shouldValidate: true });
      setValue('password', account.password, { shouldValidate: true });

      // 2. Tự động gọi đăng nhập 1-click
      try {
        await login(account.companyCode, account.username, account.password);
      } finally {
        setSelectedDemoRole(null);
      }
    },
    [isLoading, setValue, login]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
        >
          {/* ── Logo / Brand ── */}
          <View style={styles.brandSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="corporate-fare" size={36} color="#00e5ff" />
            </View>
            <Text style={styles.brandTitle}>MINI HRM</Text>
            <Text style={styles.brandSubtitle}>Hệ thống Quản lý Nhân sự</Text>
          </View>

          {/* ── Login Card ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Đăng nhập</Text>
            <Text style={styles.cardSubtitle}>
              Nhập thông tin tài khoản để tiếp tục
            </Text>

            {/* Error alert */}
            {error ? (
              <View style={styles.alertWrapper}>
                <AlertBox message={error} />
              </View>
            ) : null}

            {/* Company Code Input */}
            <ControlledInput<LoginFormData>
              name="companyCode"
              control={control}
              label="MÃ CÔNG TY"
              placeholder="VD: VP"
              icon="business"
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Username Input */}
            <ControlledInput<LoginFormData>
              name="username"
              control={control}
              label="TÊN ĐĂNG NHẬP"
              placeholder="Nhập tên đăng nhập"
              icon="person-outline"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />

            {/* Password Input */}
            <ControlledInput<LoginFormData>
              name="password"
              control={control}
              label="MẬT KHẨU"
              placeholder="Nhập mật khẩu"
              icon="lock-outline"
              rightIcon={showPassword ? 'visibility' : 'visibility-off'}
              onRightIconPress={handleTogglePassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSubmit(onSubmit)}
            />

            {/* Forgot Password */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => router.push('/login/forgot-password')}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleSubmit(onSubmit)}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading && !selectedDemoRole ? (
                <ActivityIndicator size="small" color="#00363d" />
              ) : (
                <>
                  <MaterialIcons name="login" size={18} color="#00363d" />
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                </>
              )}
            </TouchableOpacity>

            {/* ── Quick Demo Login Section ── */}
            <View className="mt-6 pt-5 border-t border-[#3b494c]/40" style={styles.demoSection}>
              {/* Tiêu đề khu vực Demo */}
              <View className="flex-row items-center justify-center mb-3">
                <Text className="text-xs font-semibold tracking-wider text-[#00daf3] uppercase">
                  — Tài khoản dùng thử (1-Click Demo) —
                </Text>
              </View>

              {/* 3 Nút Demo (Badge / Thẻ nhỏ) nằm ngang */}
              <View className="flex-row items-stretch gap-2" style={styles.demoRow}>
                {DEMO_ACCOUNTS.map((acc) => {
                  const isThisLoading = isLoading && selectedDemoRole === acc.id;
                  return (
                    <TouchableOpacity
                      key={acc.id}
                      className="flex-1 items-center justify-center py-2.5 px-1.5 rounded-xl border active:opacity-80"
                      style={[
                        styles.demoCard,
                        {
                          borderColor: acc.borderColor,
                          backgroundColor: acc.bgColor,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleQuickDemoLogin(acc)}
                      disabled={isLoading}
                    >
                      {isThisLoading ? (
                        <ActivityIndicator size="small" color={acc.textColor} />
                      ) : (
                        <>
                          <Text
                            className="text-[12px] font-bold text-center"
                            style={{ color: acc.textColor }}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {acc.badge}
                          </Text>
                          <Text
                            className="text-[10px] text-center mt-1 text-[#849396]"
                            numberOfLines={1}
                          >
                            {acc.subtitle}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Ghi chú hướng dẫn */}
              <Text className="text-[11px] text-center text-[#5a7275] mt-2.5" style={styles.demoHint}>
                * Chạm 1-click để tự động điền &amp; đăng nhập ngay lập tức
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d1516',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 229, 255, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#c3f5ff',
    letterSpacing: 3,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#849396',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  card: {
    backgroundColor: '#151d1e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(59, 73, 76, 0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dce4e5',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#849396',
    marginBottom: 24,
  },
  alertWrapper: {
    marginBottom: 16,
  },
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginTop: 4,
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#00e5ff',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00e5ff',
    borderRadius: 10,
    height: 50,
    shadowColor: '#00e5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  loginButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#00363d',
    letterSpacing: 0.5,
  },
  demoSection: {
    marginTop: 24,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(59, 73, 76, 0.45)',
  },
  demoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoHint: {
    marginTop: 10,
    fontSize: 11,
    color: '#5a7275',
    textAlign: 'center',
  },
});
