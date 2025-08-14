import { create } from 'zustand';
import { OcrDataModel } from '@/types/data-model';

interface OcrStore {
  ocrData: OcrDataModel | null;
  imageUrl: string | null;
  setOcrData: (data: OcrDataModel, url: string) => void;
  clearOcrData: () => void;
}

const useOcrStore = create<OcrStore>((set) => ({
  ocrData: null,
  imageUrl: null,
  setOcrData: (data, url) => set({ ocrData: data, imageUrl: url }),
  clearOcrData: () => set({ ocrData: null, imageUrl: null }),
}));

export default useOcrStore;
