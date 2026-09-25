import React from 'react';
import { useStore } from '@/context/StoreContext';
import { BottomSheet } from '../BottomSheet';
import { AddFishSheet } from './AddFishSheet';
import { FishDetailSheet } from './FishDetailSheet';
import { EditFishSheet } from './EditFishSheet';
import { SellFishSheet } from './SellFishSheet';
import { MoveFishSheet } from './MoveFishSheet';
import { DeleteFishSheet } from './DeleteFishSheet';
import { AddPondSheet } from './AddPondSheet';
import { EditPondSheet } from './EditPondSheet';
import { DeletePondSheet } from './DeletePondSheet';
import { SettingsSheet } from './SettingsSheet';
import { ConfirmSheet } from './ConfirmSheet';
import { ProofImageSheet } from './ProofImageSheet';

export const GlobalSheetHost: React.FC = () => {
  const { activeSheet, closeSheet, state } = useStore();

  if (!activeSheet) return null;

  const getSheetTitle = (): string => {
    switch (activeSheet.type) {
      case 'addFish':
        return 'Tambah ikan';
      case 'fishDetail':
        return activeSheet.data?.varietas || 'Detail ikan';
      case 'editFish':
        return `Edit ${activeSheet.data?.varietas || 'ikan'}`;
      case 'sellFish':
        return `Jual ${activeSheet.data?.varietas || 'ikan'}`;
      case 'moveFish':
        return 'Pindah kolam';
      case 'deleteFish':
        return 'Konfirmasi Hapus';
      case 'addPond':
        return 'Tambah kolam';
      case 'editPond':
        return 'Edit kolam';
      case 'deletePond': {
        const pond = activeSheet.data;
        const hasFish = pond ? state.fish.some((f) => f.kolamId === pond.id) : false;
        return hasFish ? 'Kolam belum kosong' : 'Konfirmasi Hapus';
      }
      case 'settings':
        return 'Pengaturan';
      case 'confirm':
        return activeSheet.data?.title || 'Konfirmasi';
      case 'proofImage':
        return 'Bukti transaksi';
      default:
        return '';
    }
  };

  const renderSheetContent = () => {
    switch (activeSheet.type) {
      case 'addFish':
        return <AddFishSheet defaultPondId={activeSheet.data?.pondId} />;
      case 'fishDetail':
        return <FishDetailSheet fish={activeSheet.data} />;
      case 'editFish':
        return <EditFishSheet fish={activeSheet.data} />;
      case 'sellFish':
        return <SellFishSheet fish={activeSheet.data} />;
      case 'moveFish':
        return <MoveFishSheet fish={activeSheet.data} />;
      case 'deleteFish':
        return <DeleteFishSheet fish={activeSheet.data} />;
      case 'addPond':
        return <AddPondSheet />;
      case 'editPond':
        return <EditPondSheet pond={activeSheet.data} />;
      case 'deletePond':
        return <DeletePondSheet pond={activeSheet.data} />;
      case 'settings':
        return <SettingsSheet />;
      case 'confirm':
        return (
          <ConfirmSheet
            message={activeSheet.data?.message}
            confirmLabel={activeSheet.data?.confirmLabel}
            onConfirm={activeSheet.data?.onConfirm}
          />
        );
      case 'proofImage':
        return <ProofImageSheet imageUri={activeSheet.data} />;
      default:
        return null;
    }
  };

  return (
    <BottomSheet
      visible={Boolean(activeSheet)}
      title={getSheetTitle()}
      onClose={closeSheet}
    >
      {renderSheetContent()}
    </BottomSheet>
  );
};
