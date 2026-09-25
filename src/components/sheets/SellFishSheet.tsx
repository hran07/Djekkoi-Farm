import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { FontNames, PAY } from '@/constants/theme';
import { Fish } from '@/lib/types';
import { rp } from '@/lib/format';
import { Field } from '../Field';
import { Select } from '../Select';
import { PhotoField } from '../PhotoField';
import { Button } from '../Button';
import { useStore } from '@/context/StoreContext';

interface SellFishSheetProps {
  fish: Fish;
}

export const SellFishSheet: React.FC<SellFishSheetProps> = ({ fish }) => {
  const theme = useTheme();
  const { sellFish, showToast } = useStore();

  const [jumlah, setJumlah] = useState('1');
  const [harga, setHarga] = useState(fish.hargaJual.toString());
  const [pembeli, setPembeli] = useState('');
  const [metode, setMetode] = useState<string>('Tunai');
  const [bukti, setBukti] = useState<string | null>(null);
  const [catatan, setCatatan] = useState('');

  const numJumlah = parseInt(jumlah, 10) || 0;
  const numHarga = parseFloat(harga) || 0;
  const totalTransaction = numJumlah * numHarga;

  const showBuktiField = metode === 'Transfer' || metode === 'QRIS';

  const handleSubmit = () => {
    if (numJumlah < 1 || numJumlah > fish.jumlah) {
      showToast(`Jumlah harus antara 1 dan ${fish.jumlah}`);
      return;
    }
    if (!pembeli.trim()) {
      showToast('Nama pembeli wajib diisi');
      return;
    }

    sellFish(fish.id, numJumlah, {
      harga: numHarga,
      beli: fish.hargaBeli,
      pembeli: pembeli.trim(),
      metode,
      catatan: catatan.trim(),
      bukti: showBuktiField ? bukti : null,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.twoRow}>
        <View style={styles.half}>
          <Field label={`Jumlah terjual (maks ${fish.jumlah})`} required>
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

        <View style={styles.half}>
          <Field label="Harga jual (per ekor)" required>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
              ]}
              value={harga}
              onChangeText={setHarga}
              keyboardType="number-pad"
            />
          </Field>
        </View>
      </View>

      {/* Live Total Transaction Box */}
      <View style={[styles.totalBox, { backgroundColor: theme.redSoft }]}>
        <Text style={[styles.totalLabel, { color: theme.ink }]}>Total transaksi</Text>
        <Text style={[styles.totalAmount, { color: theme.red }]}>{rp(totalTransaction)}</Text>
      </View>

      <Field label="Nama pembeli" required>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.surface, borderColor: theme.line, color: theme.ink },
          ]}
          value={pembeli}
          onChangeText={setPembeli}
          placeholder="Nama pembeli"
          placeholderTextColor={theme.muted}
        />
      </Field>

      <Field label="Metode pembayaran" required>
        <Select
          value={metode}
          options={PAY as unknown as string[]}
          onValueChange={setMetode}
          title="Pilih Metode Pembayaran"
        />
      </Field>


      {showBuktiField && (
        <PhotoField
          label="Foto bukti transfer"
          photoUri={bukti}
          onPhotoSelected={setBukti}
        />
      )}

      <Field label="Catatan transaksi">
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
          placeholder="mis. lunas, diambil sendiri, kirim via ekspedisi"
          placeholderTextColor={theme.muted}
        />
      </Field>

      <Button variant="pri" wide onPress={handleSubmit} style={styles.submitBtn}>
        Catat penjualan
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
  totalBox: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  totalLabel: {
    fontFamily: FontNames.sansBold,
    fontSize: 14.5,
  },
  totalAmount: {
    fontFamily: FontNames.serifExtraBold,
    fontSize: 24,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 8,
  },
});
