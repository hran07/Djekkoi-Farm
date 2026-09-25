import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Pond } from '@/lib/types';
import { Field } from '../Field';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface EditPondSheetProps {
  pond: Pond;
}

export const EditPondSheet: React.FC<EditPondSheetProps> = ({ pond }) => {
  const theme = useTheme();
  const { editPond, showToast } = useStore();

  const [name, setName] = useState(pond.name);
  const [lokasi, setLokasi] = useState(pond.lokasi);

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast('Nama / nomor kolam wajib diisi');
      return;
    }
    editPond(pond.id, name.trim(), lokasi.trim());
  };

  return (
    <View style={styles.container}>
      <Field label="Nama / nomor kolam" required>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
          ]}
          value={name}
          onChangeText={setName}
        />
      </Field>


      <Field label="Lokasi kolam">
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
          ]}
          value={lokasi}
          onChangeText={setLokasi}
        />
      </Field>

      <Text style={[styles.note, { color: theme.muted }]}>
        Jumlah ikan dihitung otomatis. Untuk mengubahnya, tambah ikan atau pindahkan ikan antar kolam.
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
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontFamily: FontNames.sansMedium,
    fontSize: 14.5,
  },
  note: {
    fontFamily: FontNames.sansMedium,
    fontSize: 13,
    marginVertical: 4,
    lineHeight: 18,
  },
  submitBtn: {
    marginTop: 8,
  },
});
