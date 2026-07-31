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

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { control, handleSubmit } = useForm<LoginFormData>({
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
              {isLoading ? (
                <ActivityIndicator size="small" color="#00363d" />
              ) : (
                <>
                  <MaterialIcons name="login" size={18} color="#00363d" />
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Test credentials hint */}
            <View style={styles.hintBox}>
              <Text style={styles.hintTitle}>Tài khoản thử nghiệm (Mã: VP)</Text>
              <Text style={styles.hintRow}>
                <Text style={styles.hintLabel}>Admin: </Text>admin / admin123
              </Text>
              <Text style={styles.hintRow}>
                <Text style={styles.hintLabel}>Team Lead: </Text>leader / leader123
              </Text>
              <Text style={styles.hintRow}>
                <Text style={styles.hintLabel}>Nhân viên: </Text>nhanvien / user123
              </Text>
              <Text style={[styles.hintRow, { marginTop: 6, color: '#5a7275', fontSize: 11 }]}>
                * Nhập phần trước @ của email (vd: admin)
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
  hintBox: {
    marginTop: 24,
    padding: 14,
    backgroundColor: 'rgba(0, 229, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.12)',
  },
  hintTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00daf3',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hintRow: {
    fontSize: 12,
    color: '#849396',
    lineHeight: 18,
  },
  hintLabel: {
    color: '#bac9cc',
    fontWeight: '600',
  },
});
