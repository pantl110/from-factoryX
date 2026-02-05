import { create } from 'zustand';
import { OcrDataModel } from '@/types/data-model';

interface OcrStoreModel {
  ocrData: OcrDataModel | null;
  imageUrl: string | null;
  thumbnailUrl: string | null; // PDF 첫 페이지 썸네일 (data URL)
  setOcrData: (
    data: OcrDataModel,
    url: string,
    thumbnailUrl?: string | null
  ) => void;
  clearOcrData: () => void;
}

const useOcrStore = create<OcrStoreModel>((set) => ({
  ocrData: null,
  imageUrl: null,
  thumbnailUrl: null,
  setOcrData: (data: OcrDataModel, url: string, thumbnailUrl?: string | null) =>
    set({ ocrData: data, imageUrl: url, thumbnailUrl: thumbnailUrl ?? null }),
  clearOcrData: () =>
    set({ ocrData: null, imageUrl: null, thumbnailUrl: null }),
}));

export default useOcrStore;
