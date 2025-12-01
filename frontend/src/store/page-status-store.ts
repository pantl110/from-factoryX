'use client';

import { create } from 'zustand';
import {
  ProductionTabType,
  SettingTabType,
  SettingChipType,
  StockTabType,
} from '@/components/top-bar/types';
import {
  ProjectStatusType,
  ProjectStatusResponseModel,
} from '@/types/data-model';

export interface PageStatusModel {
  pageStatus: string | null;
  setPageStatus: (status: string | null) => void;
  // 전체 프로젝트 상태 원본 데이터
  projectStatusData: ProjectStatusResponseModel | null;
  setProjectStatusData: (data: ProjectStatusResponseModel | null) => void;

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

  // production의 "생산 계획" 탭에서 모든 제품이 가동 완료 상태인지 여부
  isAllProductionCompleted: boolean;
  setAllProductionCompleted: (completed: boolean) => void;

  // production의 "생산 내역" 탭에서 모든 입력값이 유효한지 여부
  isProductionLogValid: boolean;
  setProductionLogValid: (valid: boolean) => void;

  // production의 "생산 내역" 탭에서 모든 plan의 material_consumed가 true이고 defective_quantity가 입력되어 있는지 여부
  isAllProductionResultComplete: boolean;
  setAllProductionResultComplete: (complete: boolean) => void;

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

  // 생산완료 단계에서 생산 내역 저장 후 다음 단계로 진행하는 함수
  handleProductionLogSave: (() => Promise<void>) | null;
  setHandleProductionLogSave: (fn: (() => Promise<void>) | null) => void;

  // 납품 데이터 (보관함으로 이동 버튼 활성화 여부 결정)
  deliveryData: Array<{ delivery_date?: string }> | null;
  setDeliveryData: (data: Array<{ delivery_date?: string }> | null) => void;
}

const usePageStatusStore = create<PageStatusModel>((set) => ({
  pageStatus: null,
  setPageStatus: (status) => set({ pageStatus: status }),

  // 프로젝트 상태 원본 데이터 저장
  projectStatusData: null,
  setProjectStatusData: (data) => set({ projectStatusData: data }),

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
  isProductionLogValid: false,
  setProductionLogValid: (valid) => set({ isProductionLogValid: valid }),
  isAllProductionResultComplete: false,
  setAllProductionResultComplete: (complete) =>
    set({ isAllProductionResultComplete: complete }),
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

  // 생산완료 단계에서 생산 내역 저장 후 다음 단계로 진행하는 함수
  handleProductionLogSave: null,
  setHandleProductionLogSave: (fn) => set({ handleProductionLogSave: fn }),

  // // 반품 여부
  // isRefund: false,
  // setIsRefund: (isRefund) => set({ isRefund }),

  // 납품 데이터
  deliveryData: null,
  setDeliveryData: (data) => set({ deliveryData: data }),

  // // 세금계산서 id
  // taxId: null,
  // setTaxId: (id) => set({ taxId: id }),
}));

export default usePageStatusStore;
