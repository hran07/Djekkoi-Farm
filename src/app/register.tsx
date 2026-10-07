import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { useAuth, getAuthErrorMessage } from '@/context/AuthContext';

export default function RegisterScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register, resendVerificationEmail } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // State Verifikasi Email
  const [isRegistered, setIsRegistered] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage('Email tidak boleh kosong.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Kata sandi harus minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await register(name, email, password);
      // Tampilkan layar verifikasi email
      setIsRegistered(true);
      setCooldown(60);
    } catch (err: any) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setResendLoading(true);
      setErrorMessage(null);
      setResendMessage(null);
      await resendVerificationEmail(email, password);
      setResendMessage('Tautan verifikasi baru berhasil dikirim. Silakan cek kotak masuk atau spam email Anda.');
      setCooldown(60);
    } catch (err: any) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 20) + 12,
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Logo size={56} />
          <Text style={[styles.brandTitle, { color: theme.ink }]}>
            {isRegistered ? 'Verifikasi Akun' : 'Daftar Akun Baru'}
          </Text>
          <Text style={[styles.brandSubtitle, { color: theme.muted }]}>
            {isRegistered
              ? 'Satu langkah lagi untuk mulai mengelola kolam & ikan koi Anda'
              : 'Buat akun untuk mencatat dan mengelola seluruh ikan koi Anda'}
          </Text>
        </View>

        {isRegistered ? (
          /* Verification Screen */
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
            ]}
          >
            <View style={styles.verificationContainer}>
              <View style={[styles.mailIconBadge, { backgroundColor: theme.accentSoft }]}>
                <Svg width={38} height={38} viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth={2}>
                  <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <Path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </View>

              <Text style={[styles.verificationTitle, { color: theme.ink }]}>
                Email Verifikasi Terkirim!
              </Text>

              <Text style={[styles.verificationDesc, { color: theme.muted }]}>
                Kami telah mengirim tautan verifikasi ke email:
              </Text>

              <View style={[styles.emailBadge, { backgroundColor: theme.bg, borderColor: theme.line }]}>
                <Text style={[styles.emailBadgeText, { color: theme.accent }]}>{email.trim()}</Text>
              </View>

              <Text style={[styles.verificationTip, { color: theme.muted }]}>
                Silakan buka kotak masuk atau folder spam email Anda, lalu klik tautan tersebut untuk mengaktifkan akun Anda sebelum masuk.
              </Text>
            </View>

            {/* Info Message (Resend success) */}
            {Boolean(resendMessage) && (
              <View style={[styles.infoBanner, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.accent} strokeWidth={2}>
                  <Path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
                </Svg>
                <Text style={[styles.infoBannerText, { color: theme.ink }]}>{resendMessage}</Text>
              </View>
            )}

            {/* Error Message */}
            {Boolean(errorMessage) && (
              <View style={[styles.errorBanner, { backgroundColor: theme.badSoft, borderColor: theme.bad }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.bad} strokeWidth={2}>
                  <Path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
                </Svg>
                <Text style={[styles.errorBannerText, { color: theme.bad }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Tombol Menuju Login */}
            <Button
              variant="pri"
              wide
              onPress={() => router.replace('/login')}
              style={styles.submitBtn}
            >
              Sudah Verifikasi? Masuk di Sini
            </Button>

            {/* Tombol Kirim Ulang Email */}
            <Button
              variant="ghost"
              wide
              disabled={resendLoading || cooldown > 0}
              onPress={handleResend}
              style={[styles.resendBtn, { borderColor: theme.line, borderWidth: 1 }]}
            >
              {resendLoading ? (
                <ActivityIndicator color={theme.accent} size="small" />
              ) : cooldown > 0 ? (
                `Kirim Ulang Email (${cooldown}s)`
              ) : (
                'Kirim Ulang Email Verifikasi'
              )}
            </Button>

            <TouchableOpacity
              onPress={() => {
                setIsRegistered(false);
                setErrorMessage(null);
                setResendMessage(null);
              }}
              style={styles.changeEmailBtn}
            >
              <Text style={[styles.changeEmailText, { color: theme.muted }]}>
                Daftar ulang dengan email lain
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Card Form Pendaftaran */
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.surface,
                borderColor: theme.line,
              },
            ]}
          >
            {/* Error Banner */}
            {Boolean(errorMessage) && (
              <View style={[styles.errorBanner, { backgroundColor: theme.badSoft, borderColor: theme.bad }]}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.bad} strokeWidth={2}>
                  <Path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
                </Svg>
                <Text style={[styles.errorBannerText, { color: theme.bad }]}>{errorMessage}</Text>
              </View>
            )}

            {/* Name Field */}
            <Field label="Nama Lengkap" required>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.bg, borderColor: theme.line },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2}>
                  <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                  <Path d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
                </Svg>
                <TextInput
                  style={[styles.input, { color: theme.ink }]}
                  placeholder="Contoh: Budi Santoso"
                  placeholderTextColor={theme.muted}
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  autoCapitalize="words"
                />
              </View>
            </Field>

            {/* Email Field */}
            <Field label="Email" required>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.bg, borderColor: theme.line },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2}>
                  <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <Path d="M22 6l-10 7L2 6" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
                <TextInput
                  style={[styles.input, { color: theme.ink }]}
                  placeholder="nama@email.com"
                  placeholderTextColor={theme.muted}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </Field>

            {/* Password Field */}
            <Field label="Kata Sandi (min. 6 karakter)" required>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.bg, borderColor: theme.line },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2}>
                  <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
                  <Path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                </Svg>
                <TextInput
                  style={[styles.input, { color: theme.ink }]}
                  placeholder="Buat kata sandi baru"
                  placeholderTextColor={theme.muted}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Lihat kata sandi"
                >
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2}>
                    {showPassword ? (
                      <>
                        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <Path d="M12 9a3 3 0 100 6 3 3 0 000-6z" />
                      </>
                    ) : (
                      <>
                        <Path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                        <Path d="M1 1l22 22" strokeLinecap="round" />
                      </>
                    )}
                  </Svg>
                </TouchableOpacity>
              </View>
            </Field>

            {/* Confirm Password Field */}
            <Field label="Ulangi Kata Sandi" required>
              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.bg, borderColor: theme.line },
                ]}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2}>
                  <Path d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z" />
                  <Path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" />
                </Svg>
                <TextInput
                  style={[styles.input, { color: theme.ink }]}
                  placeholder="Ulangi kata sandi Anda"
                  placeholderTextColor={theme.muted}
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
              </View>
            </Field>

            {/* Submit Button */}
            <Button
              variant="pri"
              wide
              onPress={handleRegister}
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <ActivityIndicator color={theme.onAccent} size="small" />
              ) : (
                'Daftar Akun'
              )}
            </Button>

            {/* Login Prompt */}
            <View style={styles.footerRow}>
              <Text style={[styles.footerText, { color: theme.muted }]}>
                Sudah punya akun?
              </Text>
              <TouchableOpacity onPress={() => router.push('/login')}>
                <Text style={[styles.linkText, { color: theme.accent }]}>
                  Masuk di Sini
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  brandTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 26,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 18,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  verificationContainer: {
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  mailIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  verificationTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 18.5,
    textAlign: 'center',
  },
  verificationDesc: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13,
    textAlign: 'center',
  },
  emailBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    marginVertical: 4,
  },
  emailBadgeText: {
    fontFamily: FontNames.sansBold,
    fontSize: 13.5,
  },
  verificationTip: {
    fontFamily: FontNames.sansRegular,
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoBannerText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },
  resendBtn: {
    marginTop: 10,
    height: 48,
  },
  changeEmailBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  changeEmailText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  errorBannerText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12.5,
    flex: 1,
    lineHeight: 17,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontFamily: FontNames.sansRegular,
    fontSize: 14.5,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    marginTop: 8,
    height: 48,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 18,
  },
  footerText: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13.5,
  },
  linkText: {
    fontFamily: FontNames.sansBold,
    fontSize: 13.5,
  },
});
