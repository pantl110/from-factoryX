// 프로젝트 상태 타입
export type ProjectStatusType =
  | "견적협의"
  | "생산 대기"
  | "생산 중"
  | "완료"
  | "납품";

// 재고 상태 타입
export type InventoryStatusType = "충분" | "부족";

// 설비 가동 상태 타입
export type OperationStatusType = "가동 대기" | "가동 중" | "가동 완료";

// 상태별 색상 모델 인터페이스
export interface StatusColorModel {
  bgColor: string;
  textColor: string;
}

// 프로젝트 상태별 색상 매핑
export const projectStatusColorMap: Record<
  ProjectStatusType,
  StatusColorModel
> = {
  견적협의: { bgColor: "bg-yellow-8", textColor: "text-yellow" },
  "생산 대기": { bgColor: "bg-lg-table", textColor: "text-bl" },
  "생산 중": { bgColor: "bg-purple-8", textColor: "text-purple" },
  완료: { bgColor: "bg-primary-8", textColor: "text-primary" },
  납품: { bgColor: "bg-green-8", textColor: "text-green" },
};

// 재고 상태별 색상 매핑
export const inventoryStatusColorMap: Record<
  InventoryStatusType,
  StatusColorModel
> = {
  충분: { textColor: "text-primary", bgColor: "bg-primary-8" },
  부족: { textColor: "text-red", bgColor: "bg-red-8" },
};

// 설비 가동 상태별 색상 매핑
export const operationStatusColorMap: Record<
  OperationStatusType,
  StatusColorModel
> = {
  "가동 대기": { textColor: "text-dg", bgColor: "bg-bg" },
  "가동 중": { textColor: "text-purple", bgColor: "bg-purple-8" },
  "가동 완료": { textColor: "text-primary", bgColor: "bg-primary-8" },
};
