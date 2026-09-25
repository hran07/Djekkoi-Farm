import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames, COND } from '@/constants/theme';
import { Fish } from '@/lib/types';
import { rp } from '@/lib/format';
import { Field } from '../Field';
import { Select } from '../Select';
import { PhotoField } from '../PhotoField';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface EditFishSheetProps {
  fish: Fish;
}

export const EditFishSheet: React.FC<EditFishSheetProps> = ({ fish }) => {
  const theme = useTheme();
  const { editFish, showToast } = useStore();

  const [foto, setFoto] = useState<string | null>(fish.foto);
  const [ukuran, setUkuran] = useState(fish.ukuran.toString());
  const [hargaBeli, setHargaBeli] = useState(fish.hargaBeli.toString());
  const [hargaJual, setHargaJual] = useState(fish.hargaJual.toString());
  const [kondisi, setKondisi] = useState(fish.kondisi);
  const [catatan, setCatatan] = useState(fish.catatan);

  const handleSubmit = () => {
    const numUkuran = parseFloat(ukuran) || fish.ukuran;
    const numHargaBeli = parseFloat(hargaBeli) || 0;
    const numHargaJual = parseFloat(hargaJual) || 0;
    const trimmedCatatan = catatan.trim();

    const logEntries: { judul: string; detail: string }[] = [];

    if (numUkuran !== fish.ukuran) {
      logEntries.push({
        judul: 'Update ukuran',
        detail: `Ukuran ${fish.ukuran} cm menjadi ${numUkuran} cm`,
      });
    }

    const priceDetails: string[] = [];
    if (numHargaJual !== fish.hargaJual) {
      priceDetails.push(`Harga jual ${rp(fish.hargaJual)} menjadi ${rp(numHargaJual)}`);
    }
    if (numHargaBeli !== fish.hargaBeli) {
      priceDetails.push(`Harga beli ${rp(fish.hargaBeli)} menjadi ${rp(numHargaBeli)}`);
    }
    if (priceDetails.length > 0) {
      logEntries.push({
        judul: 'Update harga',
        detail: priceDetails.join('. '),
      });
    }

    const otherDetails: string[] = [];
    if (kondisi !== fish.kondisi) {
      otherDetails.push(`Kondisi ${fish.kondisi} menjadi ${kondisi}`);
    }
    if (trimmedCatatan !== fish.catatan) {
      otherDetails.push('Catatan diperbarui');
    }
    if (foto !== fish.foto) {
      otherDetails.push('Foto diganti');
    }
    if (otherDetails.length > 0) {
      logEntries.push({
        judul: 'Ubah data ikan',
        detail: otherDetails.join('. '),
      });
    }

    if (logEntries.length === 0 && foto === fish.foto) {
      showToast('Tidak ada perubahan data');
      return;
    }

    editFish(
      fish.id,
      {
        foto,
        ukuran: numUkuran,
        hargaBeli: numHargaBeli,
        hargaJual: numHargaJual,
        kondisi,
        catatan: trimmedCatatan,
      },
      logEntries
    );
  };

  return (
    <View style={styles.container}>
      <PhotoField label="Ganti foto (opsional)" photoUri={foto} onPhotoSelected={setFoto} />

      <Field label="Ukuran (cm)" required>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
          ]}
          value={ukuran}
          onChangeText={setUkuran}
          keyboardType="decimal-pad"
        />
      </Field>

      <View style={styles.twoRow}>
        <View style={styles.half}>
          <Field label="Harga beli" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={hargaBeli}
              onChangeText={setHargaBeli}
              keyboardType="number-pad"
            />
          </Field>
        </View>

        <View style={styles.half}>
          <Field label="Harga jual" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={hargaJual}
              onChangeText={setHargaJual}
              keyboardType="number-pad"
            />
          </Field>
        </View>
      </View>


      <Field label="Kondisi">
        <Select
          value={kondisi}
          options={COND as unknown as string[]}
          onValueChange={setKondisi}
          title="Pilih Kondisi"
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
        />
      </Field>

      <Text style={[styles.note, { color: theme.muted }]}>
        Perubahan ukuran dan harga otomatis tercatat di riwayat.
      </Text>

      <Button variant="pri" wide onPress={handleSubmit} style={styles.submitBtn}>
        Simpan perubahan
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
  note: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    marginVertical: 6,
  },
  submitBtn: {
    marginTop: 6,
  },
});
