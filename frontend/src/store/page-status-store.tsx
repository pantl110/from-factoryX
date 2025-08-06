'use client';

import { create } from 'zustand';
import {
  ProductionTabType,
  SettingTabType,
  SettingChipType,
  StockTabType,
} from '@/components/top-bar/types';

export interface PageStatusModel {
  pageStatus: string | null;
  setPageStatus: (status: string | null) => void;
  settingTab: SettingTabType;
  setSettingTab: (tab: SettingTabType) => void;
  settingChip: SettingChipType | null;
  setSettingChip: (chip: SettingChipType | null) => void;

  productionTab: ProductionTabType | null;
  setProductionTab: (tab: ProductionTabType | null) => void;

  stockTab: StockTabType;
  setStockTab: (tab: StockTabType) => void;

  // production의 "생산 대기" 상태의 "생산 계획" 탭에서 <저장> 버튼 클릭 시 모달 오픈
  isProductionPlanSaveModalOpen: boolean;
  setProductionPlanSaveModalOpen: (open: boolean) => void;

  // production의 "생산 계획" 탭에서 다음 버튼 누르기 전 모든 필드가 입력되었는지 여부
  isProductionPlanValid: boolean;
  setProductionPlanValid: (valid: boolean) => void;

  // production의 "납품" 상태의 "납품" 탭에서 <반품 등록> 버튼 클릭 시 모달 오픈
  isAddReturnModalOpen: boolean;
  setAddReturnModalOpen: (open: boolean) => void;

  // production의 "납품" 상태의 <보관함으로 이동> 버튼 클릭 시 모달 오픈
  isMoveToStorageModalOpen: boolean;
  setMoveToStorageModalOpen: (open: boolean) => void;

  // 프로젝트 상태를 delivery로 변경하는 전역 함수 // 프로젝트 완료에서 [진행상태로 전환] 버튼
  handleChangeToDeliveryStatus: (() => Promise<void>) | null;
  setHandleChangeToDeliveryStatus: (fn: (() => Promise<void>) | null) => void;
}

const usePageStatusStore = create<PageStatusModel>((set) => ({
  pageStatus: null,
  setPageStatus: (status) => set({ pageStatus: status }),

  // production page - 첫 번째 탭을 기본값으로 설정
  productionTab: null,
  setProductionTab: (tab) => set({ productionTab: tab }),
  isProductionPlanSaveModalOpen: false,
  setProductionPlanSaveModalOpen: (open) =>
    set({ isProductionPlanSaveModalOpen: open }),
  isProductionPlanValid: false,
  setProductionPlanValid: (valid) => set({ isProductionPlanValid: valid }),
  isAddReturnModalOpen: false,
  setAddReturnModalOpen: (open) => set({ isAddReturnModalOpen: open }),
  isMoveToStorageModalOpen: false,
  setMoveToStorageModalOpen: (open) => set({ isMoveToStorageModalOpen: open }),

  // stock page
  stockTab: 'product' as StockTabType,
  setStockTab: (tab) => set({ stockTab: tab }),

  // setting page - 첫 번째 탭을 기본값으로 설정
  settingTab: 'system' as SettingTabType,
  setSettingTab: (tab) => set({ settingTab: tab }),
  settingChip: null,
  setSettingChip: (chip) => set({ settingChip: chip }),

  // 프로젝트 상태를 delivery로 변경하는 전역 함수 // 프로젝트 완료에서 [진행상태로 전환] 버튼
  handleChangeToDeliveryStatus: null,
  setHandleChangeToDeliveryStatus: (fn) =>
    set({ handleChangeToDeliveryStatus: fn }),
}));

export default usePageStatusStore;
