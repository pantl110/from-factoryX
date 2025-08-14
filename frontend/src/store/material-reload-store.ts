import { create } from 'zustand';

interface MaterialReloadModel {
  shouldReload: boolean;
  setShouldReload: (v: boolean) => void;
}

export const useMaterialReloadStore = create<MaterialReloadModel>((set) => ({
  shouldReload: false,
  setShouldReload: (v: boolean) => set({ shouldReload: v }),
}));
