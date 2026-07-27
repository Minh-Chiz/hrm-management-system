import { AlertBox } from '@/components/ui/AlertBox';
import { useAuth } from '@/context/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { login, isLoading, error } = useAuth();
  const router = useRouter();



  const [companyCode, setCompanyCode] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    login(companyCode, username, password);
  };

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
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mã công ty</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="business"
                  size={18}
                  color="#849396"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="VD: VP"
                  placeholderTextColor="#849396"
                  value={companyCode}
                  onChangeText={setCompanyCode}
                  autoCapitalize="characters"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Username Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên đăng nhập</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="person-outline"
                  size={18}
                  color="#849396"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor="#849396"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật khẩu</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="lock-outline"
                  size={18}
                  color="#849396"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#849396"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={18}
                    color="#849396"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <View style={styles.forgotPasswordContainer}>
              <TouchableOpacity
                onPress={() => router.push('/login/forgot-password')}
                className="active:scale-95 transition-all"
                activeOpacity={0.7}
              >
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
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

  /* Brand */
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

  /* Card */
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

  /* Alert */
  alertWrapper: {
    marginBottom: 16,
  },

  /* Inputs */
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#bac9cc',
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#192122',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3b494c',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#dce4e5',
    fontSize: 14,
    height: '100%',
  },
  passwordInput: {
    paddingRight: 4,
  },
  eyeButton: {
    padding: 4,
  },

  /* Forgot Password */
  forgotPasswordContainer: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: '#00e5ff',
    fontSize: 13,
    fontWeight: '600',
  },

  /* Login Button */
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00e5ff',
    borderRadius: 10,
    height: 50,
    marginTop: 8,
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

  /* Hint box */
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
