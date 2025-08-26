import { create } from 'zustand';
import { OcrDataModel } from '@/types/data-model';

interface OcrStoreModel {
  ocrData: OcrDataModel | null;
  imageUrl: string | null;
  setOcrData: (data: OcrDataModel, url: string) => void;
  clearOcrData: () => void;
}

const useOcrStore = create<OcrStoreModel>((set) => ({
  ocrData: null,
  imageUrl: null,
  setOcrData: (data: OcrDataModel, url: string) =>
    set({ ocrData: data, imageUrl: url }),
  clearOcrData: () => set({ ocrData: null, imageUrl: null }),
}));

export default useOcrStore;
