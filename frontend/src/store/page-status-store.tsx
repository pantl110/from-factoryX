"use client";

import { create } from "zustand";

export interface PageStatusState {
  pageStatus: string | null;
  setPageStatus: (status: string | null) => void;
}

const usePageStatusStore = create<PageStatusState>((set) => ({
  pageStatus: null,
  setPageStatus: (status) => set({ pageStatus: status }),
}));

export default usePageStatusStore;
