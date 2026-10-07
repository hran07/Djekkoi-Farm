import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { useAppTheme } from '@/context/ThemeContext';
import { FontNames } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Chip } from '@/components/Chip';
import { HistoryItem } from '@/components/HistoryItem';
import { EmptyState } from '@/components/EmptyState';
import { fdate } from '@/lib/format';
import { HistoryEntry } from '@/lib/types';

// ──────────────────────────────────────────────
// Sub-komponen helpers
// ──────────────────────────────────────────────
function SectionCard({ children, style }: { children: React.ReactNode; style?: object }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }, style]}>
      {children}
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.line }]} />;
}

// ──────────────────────────────────────────────
// Main: Halaman Account
// ──────────────────────────────────────────────
export default function AccountScreen() {
  const theme = useTheme();
  const { isDark, setDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, logout } = useAuth();
  const { state, historyFilter, setHistoryFilter } = useStore();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name ?? '');
  const [isSavingName, setIsSavingName] = useState(false);

  // ── Riwayat ──────────────────────────────────
  const filteredHistory = state.history.filter((h) => {
    if (historyFilter === 'all') return true;
    if (historyFilter === 'edit') return h.tipe === 'edit_ikan' || h.tipe === 'edit_kolam';
    return h.tipe === historyFilter;
  });

  const groupedEntries: { dateStr: string; items: HistoryEntry[] }[] = [];
  let currentDate = '';
  let currentGroup: HistoryEntry[] = [];
  filteredHistory.forEach((h) => {
    const dateStr = fdate(h.ts);
    if (dateStr !== currentDate) {
      if (currentGroup.length > 0) groupedEntries.push({ dateStr: currentDate, items: currentGroup });
      currentDate = dateStr;
      currentGroup = [h];
    } else {
      currentGroup.push(h);
    }
  });
  if (currentGroup.length > 0) groupedEntries.push({ dateStr: currentDate, items: currentGroup });

  // ── Edit username ─────────────────────────────
  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) { Alert.alert('Username tidak boleh kosong.'); return; }
    if (trimmed === profile?.name) { setIsEditingName(false); return; }
    if (!user) return;
    try {
      setIsSavingName(true);
      await updateProfile(auth.currentUser!, { displayName: trimmed });
      await updateDoc(doc(db, 'users', user.uid), { name: trimmed });
      setIsEditingName(false);
    } catch (e: any) {
      Alert.alert('Gagal memperbarui nama', e?.message ?? 'Coba lagi.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => { setNameInput(profile?.name ?? ''); setIsEditingName(false); };

  // ── Logout ────────────────────────────────────
  // Setelah logout(), AuthContext set user=null → root _layout redirect ke /login otomatis
  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Kamu yakin ingin keluar dari akun ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              // Redirect ke /login ditangani otomatis oleh RootNavigator
              // karena user akan menjadi null setelah logout()
            } catch (e: any) {
              Alert.alert('Gagal logout', e?.message ?? 'Coba lagi.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 100 + Math.max(insets.bottom, 12) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page Title ─── */}
        <Text style={[styles.pageTitle, { color: theme.ink }]}>Akun</Text>
        <Text style={[styles.pageSub, { color: theme.muted }]}>
          Kelola profil dan preferensi kamu.
        </Text>

        {/* ── Avatar & Identitas ─── */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.accentSoft }]}>
            <Text style={[styles.avatarLetter, { color: theme.accent }]}>
              {(profile?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, { color: theme.ink }]} numberOfLines={1}>
              {profile?.name ?? '—'}
            </Text>
            <Text style={[styles.profileEmail, { color: theme.muted }]}>
              {profile?.email ?? user?.email ?? '—'}
            </Text>
          </View>
        </View>

        {/* ── PROFIL ─── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>PROFIL</Text>
        <SectionCard>
          {/* Edit Username */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={theme.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={8} r={4} />
                <Path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </Svg>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Username</Text>
            </View>
            {!isEditingName ? (
              <TouchableOpacity
                onPress={() => setIsEditingName(true)}
                style={[styles.editPill, { backgroundColor: theme.accentSoft }]}
              >
                <Text style={[styles.editPillText, { color: theme.accent }]}>
                  {profile?.name ?? '—'}
                </Text>
                <Svg width={13} height={13} viewBox="0 0 24 24" fill="none"
                  stroke={theme.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </Svg>
              </TouchableOpacity>
            ) : (
              <View style={styles.editRow}>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  style={[styles.nameInput, { color: theme.ink, backgroundColor: theme.surface2, borderColor: theme.accent }]}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  editable={!isSavingName}
                  maxLength={40}
                />
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={isSavingName}
                  style={[styles.saveBtn, { backgroundColor: theme.accent }, isSavingName && { opacity: 0.6 }]}
                >
                  <Text style={[styles.saveBtnText, { color: theme.onAccent }]}>
                    {isSavingName ? '...' : 'Simpan'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelEdit} hitSlop={10}>
                  <Text style={{ color: theme.muted, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <Divider />

          {/* Email (readonly) */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={theme.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2z" />
                <Path d="M22 6l-10 7L2 6" />
              </Svg>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Email</Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.muted }]} numberOfLines={1}>
              {profile?.email ?? user?.email ?? '—'}
            </Text>
          </View>
        </SectionCard>

        {/* ── TAMPILAN ─── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>TAMPILAN</Text>
        <SectionCard>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={isDark ? theme.gold : theme.accent}
                strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                {isDark ? (
                  <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                ) : (
                  <>
                    <Circle cx={12} cy={12} r={5} />
                    <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </>
                )}
              </Svg>
              <View>
                <Text style={[styles.rowLabel, { color: theme.ink }]}>Tema Gelap</Text>
                <Text style={[styles.rowSub, { color: theme.muted }]}>
                  {isDark ? 'Mode malam aktif' : 'Mode terang aktif'}
                </Text>
              </View>
            </View>
            {/* Switch menggunakan useAppTheme().setDark — benar-benar mengubah tema */}
            <Switch
              value={isDark}
              onValueChange={(val) => setDark(val)}
              trackColor={{ false: theme.line, true: theme.accent }}
              thumbColor={theme.onAccent}
              ios_backgroundColor={theme.line}
            />
          </View>
        </SectionCard>

        {/* ── RIWAYAT ─── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>RIWAYAT</Text>
        <SectionCard style={{ paddingBottom: 8 }}>
          {/* Filter chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.historyChips}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}
          >
            {([['all', 'Semua'], ['masuk', 'Masuk'], ['keluar', 'Keluar'], ['edit', 'Perubahan']] as [string, string][]).map(
              ([key, label]) => (
                <Chip
                  key={key}
                  label={label}
                  active={historyFilter === key}
                  onPress={() => setHistoryFilter(key)}
                />
              )
            )}
          </ScrollView>

          <Divider />

          <View style={styles.historyList}>
            {groupedEntries.length > 0 ? (
              groupedEntries.map((group) => (
                <View key={group.dateStr} style={styles.historyGroup}>
                  <Text style={[styles.dayTitle, { color: theme.muted }]}>{group.dateStr}</Text>
                  {group.items.map((item) => (
                    <HistoryItem key={item.id} item={item} />
                  ))}
                </View>
              ))
            ) : (
              <EmptyState
                title="Belum ada catatan"
                description="Riwayat terisi otomatis saat kamu mengubah data."
              />
            )}
          </View>
        </SectionCard>

        {/* ── TENTANG ─── */}
        <Text style={[styles.sectionLabel, { color: theme.muted }]}>TENTANG</Text>
        <SectionCard>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                stroke={theme.accent} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <Circle cx={12} cy={12} r={10} />
                <Path d="M12 8v4M12 16h.01" />
              </Svg>
              <Text style={[styles.rowLabel, { color: theme.ink }]}>Versi Aplikasi</Text>
            </View>
            <Text style={[styles.rowValue, { color: theme.muted }]}>1.0.0</Text>
          </View>
        </SectionCard>

        {/* ── Logout Button ─── */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: theme.redSoft, borderColor: theme.red }]}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Keluar dari akun"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none"
            stroke={theme.red} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
            <Path d="M16 17l5-5-5-5" />
            <Path d="M21 12H9" />
          </Svg>
          <Text style={[styles.logoutText, { color: theme.red }]}>Keluar dari Akun</Text>
        </TouchableOpacity>

        {profile?.createdAt && (
          <Text style={[styles.memberSince, { color: theme.muted }]}>
            Bergabung sejak{' '}
            {new Date(profile.createdAt).toLocaleDateString('id-ID', {
              year: 'numeric', month: 'long', day: 'numeric',
            })}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  pageTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 26,
    lineHeight: 30,
    marginTop: 6,
    marginBottom: 4,
  },
  pageSub: { fontFamily: FontNames.sansMedium, fontSize: 14, marginBottom: 20 },
  avatarSection: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  avatarCircle: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontFamily: FontNames.sansBold, fontSize: 28, lineHeight: 32 },
  profileName: { fontFamily: FontNames.sansBold, fontSize: 18, lineHeight: 22 },
  profileEmail: { fontFamily: FontNames.sansMedium, fontSize: 13, marginTop: 2 },
  sectionLabel: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 11.5,
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: { borderRadius: 16, borderWidth: 1, marginBottom: 16, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  rowLabel: { fontFamily: FontNames.sansSemiBold, fontSize: 15 },
  rowSub: { fontFamily: FontNames.sansMedium, fontSize: 12, marginTop: 1 },
  rowValue: { fontFamily: FontNames.sansMedium, fontSize: 14, maxWidth: 180 },
  divider: { height: 1, marginHorizontal: 16 },
  editPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  editPillText: { fontFamily: FontNames.sansSemiBold, fontSize: 14 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  nameInput: {
    flex: 1,
    fontFamily: FontNames.sansMedium,
    fontSize: 14,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  saveBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  saveBtnText: { fontFamily: FontNames.sansBold, fontSize: 13 },
  // ── Riwayat ──────────────────────────────────
  historyChips: { flexDirection: 'row' },
  historyList: { paddingHorizontal: 16, paddingBottom: 8 },
  historyGroup: { marginBottom: 12 },
  dayTitle: { fontFamily: FontNames.sansBold, fontSize: 13.5, marginTop: 12, marginBottom: 6 },
  // ── Logout ───────────────────────────────────
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 16,
    paddingVertical: 15,
    marginBottom: 16,
  },
  logoutText: { fontFamily: FontNames.sansBold, fontSize: 15.5 },
  memberSince: { fontFamily: FontNames.sansMedium, fontSize: 12.5, textAlign: 'center', marginBottom: 8 },
});
