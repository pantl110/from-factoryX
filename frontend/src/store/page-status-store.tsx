'use client';

import { create } from 'zustand';
import {
  ProductionTabType,
  SettingTabType,
  SettingChipType,
  StockTabType,
} from '@/components/top-bar/types';
import { ProjectStatusType } from '@/types/data-model';

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

  // production의 "생산 계획" 탭에서 모든 품목이 가동 완료 상태인지 여부
  isAllProductionCompleted: boolean;
  setAllProductionCompleted: (completed: boolean) => void;

  // production의 "납품" 상태의 "납품" 탭에서 <반품 등록> 버튼 클릭 시 모달 오픈
  isAddReturnModalOpen: boolean;
  setAddReturnModalOpen: (open: boolean) => void;

  // production의 "납품" 상태의 <보관함으로 이동> 버튼 클릭 시 모달 오픈
  isMoveToStorageModalOpen: boolean;
  setMoveToStorageModalOpen: (open: boolean) => void;

  // 프로젝트 상태를 변경하는 전역 함수
  handleChangeStatus: ((status: ProjectStatusType) => Promise<void>) | null;
  setHandleChangeStatus: (
    fn: ((status: ProjectStatusType) => Promise<void>) | null
  ) => void;
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
  isAllProductionCompleted: false,
  setAllProductionCompleted: (completed) =>
    set({ isAllProductionCompleted: completed }),
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

  // 프로젝트 상태를 변경하는 전역 함수
  handleChangeStatus: null,
  setHandleChangeStatus: (fn) => set({ handleChangeStatus: fn }),
}));

export default usePageStatusStore;
