import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';
import { FontNames, GRADES, SEX, COND, VARS } from '@/constants/theme';
import { useStore } from '@/context/StoreContext';
import { Field } from '../Field';
import { Select } from '../Select';
import { PhotoField } from '../PhotoField';
import { Button } from '../Button';

interface AddFishSheetProps {
  defaultPondId?: string;
}

export const AddFishSheet: React.FC<AddFishSheetProps> = ({ defaultPondId }) => {
  const theme = useTheme();
  const { state, addFish, pondFilter, showToast, openSheet, deleteVarietyHistory } = useStore();

  useEffect(() => {
    if (state.ponds.length === 0) {
      showToast('Tambah kolam dulu sebelum menambah ikan');
      openSheet('addPond');
    }
  }, [state.ponds.length, showToast, openSheet]);

  if (state.ponds.length === 0) {
    return null;
  }

  const initialPondId =
    defaultPondId ||
    (pondFilter !== 'all' ? pondFilter : state.ponds[0]?.id || '');

  const [foto, setFoto] = useState<string | null>(null);
  const [varietas, setVarietas] = useState('');
  const [jumlah, setJumlah] = useState('1');
  const [ukuran, setUkuran] = useState('');
  const [grade, setGrade] = useState<string>('A');
  const [asal, setAsal] = useState('');
  const [kelamin, setKelamin] = useState<string>('Belum diketahui');
  const [kondisi, setKondisi] = useState<string>('Sehat');
  const [hargaBeli, setHargaBeli] = useState('');
  const [hargaJual, setHargaJual] = useState('');
  const [kolamId, setKolamId] = useState(initialPondId);
  const [catatan, setCatatan] = useState('');
  const [display, setDisplay] = useState(true);

  const pondOptions = state.ponds.map((p) => ({ label: p.name, value: p.id }));

  const trimmedQuery = varietas.trim().toLowerCase();
  const filteredVarietySuggestions = (state.varietyHistory || []).filter(
    (v) =>
      trimmedQuery !== '' &&
      v.toLowerCase().includes(trimmedQuery) &&
      v.toLowerCase() !== trimmedQuery
  );

  const handleLongPressVariety = (sug: string) => {
    openSheet('confirm', {
      title: 'Hapus Rekomendasi',
      message: `Hapus "${sug}" dari daftar rekomendasi?`,
      confirmLabel: 'Hapus',
      onConfirm: () => {
        deleteVarietyHistory(sug);
      },
    });
  };

  const handleSubmit = () => {
    if (!varietas.trim()) {
      showToast('Jenis / varietas wajib diisi');
      return;
    }
    if (!asal.trim()) {
      showToast('Asal ikan wajib diisi');
      return;
    }
    const numJumlah = Math.max(1, parseInt(jumlah, 10) || 1);
    const numUkuran = parseFloat(ukuran) || 0;
    const numHargaBeli = parseFloat(hargaBeli) || 0;
    const numHargaJual = parseFloat(hargaJual) || 0;

    if (!kolamId) {
      showToast('Pilih kolam terlebih dahulu');
      return;
    }

    addFish({
      foto,
      varietas: varietas.trim(),
      jumlah: numJumlah,
      ukuran: numUkuran,
      grade,
      asal: asal.trim(),
      kelamin,
      kondisi,
      hargaBeli: numHargaBeli,
      hargaJual: numHargaJual,
      kolamId,
      catatan: catatan.trim(),
      display,
    });
  };

  return (
    <View style={styles.container}>
      <PhotoField label="Foto ikan" photoUri={foto} onPhotoSelected={setFoto} />

      <View style={styles.twoRow}>
        <View style={styles.half}>
          <Field label="Jenis / varietas" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={varietas}
              onChangeText={setVarietas}
              placeholder="mis. Kohaku"
              placeholderTextColor={theme.muted}
            />
          </Field>
        </View>

        <View style={styles.half}>
          <Field label="Jumlah (ekor)" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={jumlah}
              onChangeText={setJumlah}
              keyboardType="number-pad"
            />
          </Field>
        </View>
      </View>

      {/* Variety suggestion chips from user history */}
      {filteredVarietySuggestions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {filteredVarietySuggestions.map((sug) => (
            <TouchableOpacity
              key={sug}
              style={[styles.sugChip, { backgroundColor: theme.accentSoft, borderColor: theme.accent }]}
              onPress={() => setVarietas(sug)}
              onLongPress={() => handleLongPressVariety(sug)}
              delayLongPress={400}
              accessibilityRole="button"
              accessibilityLabel={`Rekomendasi ${sug}`}
            >
              <Text style={[styles.sugText, { color: theme.accent }]}>+ {sug}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}


      <View style={styles.twoRow}>
        <View style={styles.half}>
          <Field label="Ukuran (cm)" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={ukuran}
              onChangeText={setUkuran}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={theme.muted}
            />
          </Field>
        </View>

        <View style={styles.half}>
          <Field label="Grade / kualitas" required>
            <Select
              value={grade}
              options={GRADES as unknown as string[]}
              onValueChange={setGrade}
              title="Pilih Grade"
            />
          </Field>
        </View>
      </View>

      <Field label="Asal ikan" required>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
          ]}
          value={asal}
          onChangeText={setAsal}
          placeholder="mis. Blitar atau Niigata, Jepang"
          placeholderTextColor={theme.muted}
        />
      </Field>

      <View style={styles.twoRow}>
        <View style={styles.half}>
          <Field label="Jenis kelamin">
            <Select
              value={kelamin}
              options={SEX as unknown as string[]}
              onValueChange={setKelamin}
              title="Pilih Jenis Kelamin"
            />
          </Field>
        </View>

        <View style={styles.half}>
          <Field label="Kondisi / status">
            <Select
              value={kondisi}
              options={COND as unknown as string[]}
              onValueChange={setKondisi}
              title="Pilih Kondisi"
            />
          </Field>
        </View>
      </View>

      <View style={styles.twoRow}>
        <View style={styles.half}>
          <Field label="Harga beli (per ekor)" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={hargaBeli}
              onChangeText={setHargaBeli}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.muted}
            />
          </Field>
        </View>

        <View style={styles.half}>
          <Field label="Harga jual (per ekor)" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={hargaJual}
              onChangeText={setHargaJual}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={theme.muted}
            />
          </Field>
        </View>
      </View>

      <Field label="Kolam" required>
        <Select
          value={kolamId}
          options={pondOptions}
          onValueChange={setKolamId}
          title="Pilih Kolam"
        />
      </Field>


      <Field label="Catatan khusus">
        <TextInput
          style={[
            styles.input,
            styles.textArea,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
          ]}
          value={catatan}
          onChangeText={setCatatan}
          multiline
          numberOfLines={3}
          placeholder="Pola, kepala, sertifikat, perilaku, dll"
          placeholderTextColor={theme.muted}
        />
      </Field>

      <TouchableOpacity
        style={styles.chkRow}
        onPress={() => setDisplay(!display)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: display }}
      >
        <View
          style={[
            styles.checkbox,
            {
              backgroundColor: display ? theme.accent : theme.surface,
              borderColor: display ? theme.accent : theme.line,
            },
          ]}
        >
          {display && (
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={3}>
              <Path d="M20 6L9 17l-5-5" />
            </Svg>
          )}
        </View>
        <Text style={[styles.chkText, { color: theme.ink }]}>
          Tampilkan di display penjualan
        </Text>
      </TouchableOpacity>

      <Button variant="pri" wide onPress={handleSubmit} style={styles.submitBtn}>
        Simpan ikan
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  twoRow: {
    flexDirection: 'row',
    gap: 10,
  },
  half: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontFamily: FontNames.sansMedium,
    fontSize: 14.5,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    marginBottom: 8,
    marginTop: -4,
  },
  sugChip: {
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  sugText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 12,
  },
  chkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chkText: {
    fontFamily: FontNames.sansSemiBold,
    fontSize: 14,
  },
  submitBtn: {
    marginTop: 8,
  },
});
