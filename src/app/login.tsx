import React, { useState } from 'react';
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

export default function LoginScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Mohon isi email dan kata sandi Anda.');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage(null);
      await login(email, password);
      // Setelah user berhasil login, langsung arahkan ke halaman pengelolaan ikan
      router.replace('/ikan');
    } catch (err: any) {
      setErrorMessage(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
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
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 20) + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Logo size={62} />
          <Text style={[styles.brandTitle, { color: theme.ink }]}>Djekkoi Farm</Text>
          <Text style={[styles.brandSubtitle, { color: theme.muted }]}>
            Masuk untuk mengelola kolam & koleksi ikan Anda
          </Text>
        </View>

        {/* Card Form */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.surface,
              borderColor: theme.line,
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: theme.ink }]}>Masuk ke Akun</Text>

          {/* Error Banner */}
          {Boolean(errorMessage) && (
            <View style={[styles.errorBanner, { backgroundColor: theme.badSoft, borderColor: theme.bad }]}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={theme.bad} strokeWidth={2}>
                <Path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" />
              </Svg>
              <Text style={[styles.errorBannerText, { color: theme.bad }]}>{errorMessage}</Text>
            </View>
          )}

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
          <Field label="Kata Sandi" required>
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
                placeholder="Masukkan kata sandi"
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

          {/* Submit Button */}
          <Button
            variant="pri"
            wide
            onPress={handleLogin}
            disabled={loading}
            style={styles.submitBtn}
          >
            {loading ? (
              <ActivityIndicator color={theme.onAccent} size="small" />
            ) : (
              'Masuk'
            )}
          </Button>

          {/* Register Prompt */}
          <View style={styles.footerRow}>
            <Text style={[styles.footerText, { color: theme.muted }]}>
              Belum punya akun?
            </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.linkText, { color: theme.accent }]}>
                Daftar Sekarang
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
    marginBottom: 26,
    gap: 8,
  },
  brandTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 28,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13.5,
    textAlign: 'center',
    maxWidth: 290,
    lineHeight: 19,
  },
  card: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 22,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 18,
    marginBottom: 16,
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
