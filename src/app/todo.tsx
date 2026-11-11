import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/context/StoreContext';
import { useTodos } from '@/hooks/useTodos';
import { Todo, TodoPeriod } from '@/lib/types';
import { isTodoDone } from '@/lib/todoPeriod';
import { Chip } from '@/components/Chip';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { EmptyState } from '@/components/EmptyState';
import { Skeleton } from '@/components/Skeleton';
import { BottomSheet } from '@/components/BottomSheet';
import { Toast } from '@/components/Toast';

// ── Skeleton Placeholder ──────────────────────────────────────
function TodoSkeleton() {
  const theme = useTheme();
  return (
    <View style={styles.skeletonList}>
      {[1, 2, 3, 4].map((item) => (
        <View
          key={item}
          style={[
            styles.todoCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <Skeleton width={26} height={26} borderRadius={8} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="75%" height={16} borderRadius={4} />
            <Skeleton width="40%" height={12} borderRadius={4} />
          </View>
          <Skeleton width={32} height={32} borderRadius={8} />
        </View>
      ))}
    </View>
  );
}

export default function TodoScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useStore();

  const { todos, status, reload, add, toggle, remove } = useTodos(user?.uid);

  const [period, setPeriod] = useState<TodoPeriod>('harian');
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Form Tambah Todo (Sheet)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState<TodoPeriod>('harian');
  const [isSaving, setIsSaving] = useState(false);

  // Hitung ulang status setiap kali halaman difokuskan kembali
  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
      reload();
    }, [reload])
  );

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setCurrentDate(new Date());
    await reload();
    setIsRefreshing(false);
  }, [reload]);

  const handleOpenAddSheet = () => {
    setNewTitle('');
    setNewPeriod(period);
    setIsAddSheetOpen(true);
  };

  const handleSaveTodo = async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) {
      showToast('Judul aktivitas wajib diisi');
      return;
    }
    if (trimmed.length > 80) {
      showToast('Judul maksimal 80 karakter');
      return;
    }

    try {
      setIsSaving(true);
      await add(trimmed, newPeriod);
      setIsAddSheetOpen(false);
      setNewTitle('');
      showToast('Aktivitas perawatan ditambahkan');
    } catch {
      // Error toast sudah ditangani di hook useTodos
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteTodo = (item: Todo) => {
    Alert.alert(
      'Hapus Todo',
      `Kamu yakin ingin menghapus "${item.title}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await remove(item.id);
            showToast('Aktivitas dihapus');
          },
        },
      ],
      { cancelable: true }
    );
  };

  // Filter todo sesuai segmen aktif
  const currentTodos = todos.filter((t) => t.period === period);
  const completedCount = currentTodos.filter((t) => isTodoDone(t, currentDate)).length;
  const totalCount = currentTodos.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.bg,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.line,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backBtn,
            { backgroundColor: theme.surface2, borderColor: theme.line },
          ]}
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <Svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.ink}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M15 18l-6-6 6-6" />
          </Svg>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: theme.ink }]} numberOfLines={1}>
            Todo List
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.muted }]}>
            Perawatan Kolam & Ikan
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addHeaderBtn,
            { backgroundColor: theme.accentSoft, borderColor: theme.accent },
          ]}
          onPress={handleOpenAddSheet}
          accessibilityRole="button"
          accessibilityLabel="Tambah Todo"
        >
          <Svg
            width={18}
            height={18}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.accent}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <Path d="M12 5v14M5 12h14" />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.accent}
          />
        }
      >
        {/* ── Tab / Segment Kontrol ─────────────────────────────── */}
        <View style={styles.segmentRow}>
          <Chip
            label={`Harian (${todos.filter((t) => t.period === 'harian').length})`}
            active={period === 'harian'}
            onPress={() => setPeriod('harian')}
            accessibilityLabel="Filter Todo Harian"
          />
          <Chip
            label={`Mingguan (${todos.filter((t) => t.period === 'mingguan').length})`}
            active={period === 'mingguan'}
            onPress={() => setPeriod('mingguan')}
            accessibilityLabel="Filter Todo Mingguan"
          />
        </View>

        {/* ── Ringkasan Progress ─────────────────────────────────── */}
        <View
          style={[
            styles.progressCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View style={styles.progressHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.progressTitle, { color: theme.ink }]}>
                {period === 'harian'
                  ? 'Perawatan Hari Ini'
                  : 'Perawatan Minggu Ini'}
              </Text>
              <Text style={[styles.progressSubtitle, { color: theme.muted }]}>
                {period === 'harian'
                  ? 'Reset otomatis setiap hari baru'
                  : 'Reset otomatis setiap hari Senin'}
              </Text>
            </View>
            <Text style={[styles.progressBadge, { color: theme.accent }]}>
              {completedCount}/{totalCount} selesai
            </Text>
          </View>

          {/* Bar Progress */}
          <View
            style={[styles.progressBarTrack, { backgroundColor: theme.surface2 }]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor:
                    progressPercent === 100 && totalCount > 0
                      ? theme.ok
                      : theme.accent,
                },
              ]}
            />
          </View>
        </View>

        {/* ── State Loading / Error / Konten ───────────────────── */}
        {status === 'loading' && todos.length === 0 ? (
          <TodoSkeleton />
        ) : status === 'error' && todos.length === 0 ? (
          <View style={styles.errorWrap}>
            <EmptyState
              title="Gagal Memuat Todo"
              description="Tidak dapat membaca data penyimpanan lokal. Silakan coba lagi."
            />
            <Button
              variant="pri"
              onPress={reload}
              style={{ marginTop: 12, minWidth: 140 }}
            >
              Coba Lagi
            </Button>
          </View>
        ) : currentTodos.length === 0 ? (
          <View style={{ marginTop: 10 }}>
            <EmptyState
              title={`Belum Ada Todo ${period === 'harian' ? 'Harian' : 'Mingguan'}`}
              description={
                period === 'harian'
                  ? 'Tambahkan rutinitas harian seperti pemberian pakan atau pengecekan kejernihan air.'
                  : 'Tambahkan rutinitas mingguan seperti pembersihan filter atau penggantian sebagian air.'
              }
            />
            <Button
              variant="pri"
              onPress={handleOpenAddSheet}
              style={{ marginTop: 12, alignSelf: 'center' }}
            >
              + Tambah Todo {period === 'harian' ? 'Harian' : 'Mingguan'}
            </Button>
          </View>
        ) : (
          <View style={styles.todoList}>
            {currentTodos.map((item) => {
              const isDone = isTodoDone(item, currentDate);
              return (
                <View
                  key={item.id}
                  style={[
                    styles.todoCard,
                    {
                      backgroundColor: theme.surface,
                      borderColor: isDone ? theme.okSoft : theme.line,
                    },
                  ]}
                >
                  {/* Tombol Checkbox */}
                  <TouchableOpacity
                    style={styles.checkboxTouch}
                    onPress={() => toggle(item.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isDone }}
                    accessibilityLabel={
                      isDone
                        ? `Tandai belum selesai: ${item.title}`
                        : `Tandai selesai: ${item.title}`
                    }
                  >
                    <View
                      style={[
                        styles.checkboxBox,
                        isDone
                          ? { backgroundColor: theme.ok, borderColor: theme.ok }
                          : {
                              backgroundColor: theme.surface2,
                              borderColor: theme.line,
                            },
                      ]}
                    >
                      {isDone && (
                        <Svg
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={theme.onAccent}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <Path d="M20 6L9 17l-5-5" />
                        </Svg>
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Isi Teks Todo */}
                  <TouchableOpacity
                    style={styles.todoContentTouch}
                    onPress={() => toggle(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.todoTitle,
                        {
                          color: isDone ? theme.muted : theme.ink,
                          textDecorationLine: isDone ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.todoMeta, { color: theme.muted }]}>
                      {isDone ? 'Selesai untuk periode ini' : 'Belum selesai'}
                    </Text>
                  </TouchableOpacity>

                  {/* Tombol Hapus */}
                  <TouchableOpacity
                    style={styles.deleteTouch}
                    onPress={() => handleDeleteTodo(item)}
                    accessibilityRole="button"
                    accessibilityLabel={`Hapus todo ${item.title}`}
                  >
                    <Svg
                      width={18}
                      height={18}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={theme.muted}
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <Path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Sheet Tambah Todo ─────────────────────────── */}
      <BottomSheet
        visible={isAddSheetOpen}
        title="Tambah Aktivitas Perawatan"
        onClose={() => setIsAddSheetOpen(false)}
      >
        <View style={styles.sheetForm}>
          {/* Pilihan Periode */}
          <View style={styles.sheetPeriodRow}>
            <Chip
              label="Harian"
              active={newPeriod === 'harian'}
              onPress={() => setNewPeriod('harian')}
            />
            <Chip
              label="Mingguan"
              active={newPeriod === 'mingguan'}
              onPress={() => setNewPeriod('mingguan')}
            />
          </View>

          <Field label="Aktivitas Perawatan" required>
            <TextInput
              style={[
                styles.sheetInput,
                {
                  backgroundColor: theme.surface,
                  borderColor: theme.line,
                  color: theme.ink,
                },
              ]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="mis. Cek kualitas & kadar garam air"
              placeholderTextColor={theme.muted}
              maxLength={80}
              autoFocus
            />
            <Text style={[styles.charCounter, { color: theme.muted }]}>
              {newTitle.length}/80 karakter
            </Text>
          </Field>

          <Button
            variant="pri"
            wide
            onPress={handleSaveTodo}
            disabled={isSaving || !newTitle.trim()}
            style={{ marginTop: 8 }}
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Aktivitas'}
          </Button>
        </View>
      </BottomSheet>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 18,
  },
  headerSubtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    marginTop: 1,
  },
  addHeaderBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  progressCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  progressTitle: {
    fontFamily: FontNames.sansBold,
    fontSize: 15,
  },
  progressSubtitle: {
    fontFamily: FontNames.sansMedium,
    fontSize: 12,
    marginTop: 2,
  },
  progressBadge: {
    fontFamily: FontNames.sansBold,
    fontSize: 13,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  todoList: {
    gap: 10,
  },
  todoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  checkboxTouch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoContentTouch: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  todoTitle: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 14.5,
    lineHeight: 20,
  },
  todoMeta: {
    fontFamily: FontNames.sansMedium,
    fontSize: 11.5,
    marginTop: 2,
  },
  deleteTouch: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonList: {
    gap: 10,
    marginTop: 4,
  },
  errorWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  sheetForm: {
    paddingBottom: 24,
  },
  sheetPeriodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  sheetInput: {
    fontFamily: FontNames.sansMedium,
    fontSize: 14.5,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  charCounter: {
    fontFamily: FontNames.sansMedium,
    fontSize: 11.5,
    textAlign: 'right',
    marginTop: 4,
  },
});

