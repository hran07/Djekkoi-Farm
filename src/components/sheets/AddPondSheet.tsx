import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Field } from '../Field';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

export const AddPondSheet: React.FC = () => {
  const theme = useTheme();
  const { addPond, showToast } = useStore();

  const [name, setName] = useState('');
  const [lokasi, setLokasi] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      showToast('Nama / nomor kolam wajib diisi');
      return;
    }
    addPond(name.trim(), lokasi.trim());
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
          placeholder="mis. Kolam A3"
          placeholderTextColor={theme.muted}
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
          placeholder="mis. Halaman belakang"
          placeholderTextColor={theme.muted}
        />
      </Field>

      <Text style={[styles.note, { color: theme.muted }]}>
        Jumlah ikan dihitung otomatis dari ikan yang ada di kolam.
      </Text>

      <Button variant="pri" wide onPress={handleSubmit} style={styles.submitBtn}>
        Simpan kolam
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
  },
  submitBtn: {
    marginTop: 8,
  },
});
