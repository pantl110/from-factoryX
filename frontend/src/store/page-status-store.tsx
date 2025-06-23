"use client";

import { create } from "zustand";

export interface PageStatusState {
  pageStatus: string | null;
  setPageStatus: (status: string | null) => void;
  selectedTab: string | null;
  setSelectedTab: (tab: string | null) => void;

  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 <저장> 버튼 클릭 시 모달 오픈
  isProductionPlanSaveModalOpen: boolean;
  setProductionPlanSaveModalOpen: (open: boolean) => void;

  // production의 "납품" 상태의 "납품" 탭에서 <반품 등록> 버튼 클릭 시 모달 오픈
  isAddReturnModalOpen: boolean;
  setAddReturnModalOpen: (open: boolean) => void;
}

const usePageStatusStore = create<PageStatusState>((set) => ({
  pageStatus: null,
  setPageStatus: (status) => set({ pageStatus: status }),
  selectedTab: null,
  setSelectedTab: (tab) => set({ selectedTab: tab }),
  isProductionPlanSaveModalOpen: false,
  setProductionPlanSaveModalOpen: (open) =>
    set({ isProductionPlanSaveModalOpen: open }),
  isAddReturnModalOpen: false,
  setAddReturnModalOpen: (open) => set({ isAddReturnModalOpen: open }),
}));

export default usePageStatusStore;
