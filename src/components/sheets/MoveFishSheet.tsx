import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames } from '@/constants/theme';
import { Fish } from '@/lib/types';
import { fLabel } from '@/lib/format';
import { Field } from '../Field';
import { Select } from '../Select';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface MoveFishSheetProps {
  fish: Fish;
}

export const MoveFishSheet: React.FC<MoveFishSheetProps> = ({ fish }) => {
  const theme = useTheme();
  const { state, moveFish, getPondName, showToast, closeSheet } = useStore();

  const otherPonds = state.ponds.filter((p) => p.id !== fish.kolamId);
  const currentPondName = getPondName(fish.kolamId);

  const [jumlah, setJumlah] = useState(fish.jumlah.toString());
  const [targetPondId, setTargetPondId] = useState(otherPonds[0]?.id || '');

  useEffect(() => {
    if (otherPonds.length === 0) {
      showToast('Belum ada kolam lain');
      closeSheet();
    }
  }, [otherPonds.length, showToast, closeSheet]);

  if (otherPonds.length === 0) {
    return null;
  }

  const pondOptions = otherPonds.map((p) => ({ label: p.name, value: p.id }));

  const handleSubmit = () => {
    const numJumlah = parseInt(jumlah, 10) || 0;
    if (numJumlah < 1 || numJumlah > fish.jumlah) {
      showToast(`Jumlah harus antara 1 dan ${fish.jumlah}`);
      return;
    }
    if (!targetPondId) {
      showToast('Pilih kolam tujuan');
      return;
    }

    moveFish(fish.id, targetPondId, numJumlah);
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.leadText, { color: theme.ink }]}>
        {fLabel(fish)} sekarang di <Text style={styles.bold}>{currentPondName}</Text>.
      </Text>

      <Field label={`Jumlah dipindah (maks ${fish.jumlah})`} required>
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

      <Field label="Kolam tujuan" required>
        <Select
          value={targetPondId}
          options={pondOptions}
          onValueChange={setTargetPondId}
          title="Pilih Kolam Tujuan"
        />
      </Field>


      <Button variant="pri" wide onPress={handleSubmit} style={styles.submitBtn}>
        Pindahkan
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  leadText: {
    fontFamily: FontNames.sansMedium,
    fontSize: 15,
    marginBottom: 8,
    lineHeight: 22,
  },
  bold: {
    fontFamily: FontNames.sansBold,
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
  submitBtn: {
    marginTop: 10,
  },
});
