import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';
import { useAuth } from '@/context/AuthContext';

export const SettingsSheet: React.FC = () => {
  const theme = useTheme();
  const { openSheet, closeSheet, wipeData, clearStore } = useStore();
  const { profile, user, logout } = useAuth();

  const handleLogoutPress = () => {
    openSheet('confirm', {
      title: 'Keluar Akun',
      message: 'Apakah Anda yakin ingin keluar dari akun ini?',
      confirmLabel: 'Ya, Keluar',
      onConfirm: async () => {
        closeSheet();
        clearStore();
        await logout();
      },
    });
  };

  const handleWipePress = () => {
    openSheet('confirm', {
      title: 'Konfirmasi Hapus Data',
      message: 'Semua ikan, kolam, dan riwayat di akun ini akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.',
      confirmLabel: 'Ya, hapus semua',
      onConfirm: wipeData,
    });
  };

  return (
    <View style={styles.container}>
      {/* Account Info Card */}
      <View style={[styles.accountCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={[styles.avatar, { backgroundColor: theme.accentSoft }]}>
          <Text style={[styles.avatarText, { color: theme.accent }]}>
            {(profile?.name || user?.displayName || user?.email || 'U')[0].toUpperCase()}
          </Text>
        </View>
        <View style={styles.accountDetails}>
          <Text style={[styles.accountName, { color: theme.ink }]}>
            {profile?.name || user?.displayName || 'Pengguna Djekkoi'}
          </Text>
          <Text style={[styles.accountEmail, { color: theme.muted }]}>
            {user?.email || 'Tidak ada email'}
          </Text>
          <View style={[styles.uidBadge, { backgroundColor: theme.surface2 }]}>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={theme.muted} strokeWidth={2}>
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <Text style={[styles.uidText, { color: theme.muted }]} numberOfLines={1}>
              UID: {user?.uid.slice(0, 12)}...
            </Text>
          </View>
        </View>
      </View>

      <Text style={[styles.noteText, { color: theme.muted }]}>
        Data kolam dan ikan tersinkronisasi di Firebase dan diisolasi khusus untuk akun Anda.
      </Text>

      <Button
        variant="ghost"
        wide
        onPress={handleLogoutPress}
        style={[styles.logoutBtn, { borderColor: theme.line, borderWidth: 1 }]}
      >
        Keluar dari Akun (Logout)
      </Button>

      <Button variant="red" wide onPress={handleWipePress} style={styles.wipeBtn}>
        Kosongkan data akun ini
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: FontNames.sansBold,
    fontSize: 19,
  },
  accountDetails: {
    flex: 1,
    gap: 2,
  },
  accountName: {
    fontFamily: FontNames.sansBold,
    fontSize: 15,
  },
  accountEmail: {
    fontFamily: FontNames.sansRegular,
    fontSize: 13,
  },
  uidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  uidText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 10.5,
  },
  noteText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    lineHeight: 19,
  },
  logoutBtn: {
    marginTop: 4,
  },
  wipeBtn: {
    marginTop: 2,
  },
});

