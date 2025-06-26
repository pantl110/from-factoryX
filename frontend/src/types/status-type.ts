// 상태별 색상 모델 인터페이스
export interface StatusColorModel {
  bgColor: string;
  textColor: string;
  hover?: string;
}

// 디자인팀 확인 필요// dashboard 생산 상태
export type ProductionStatusType = "생산 완료" | "가동 대기" | "생산 중";
export const ProductionStatusColorMap: Record<
  ProductionStatusType,
  StatusColorModel
> = {
  "생산 완료": {
    textColor: "text-primary",
    bgColor: "bg-primary-8",
  },
  "가동 대기": {
    textColor: "text-bl",
    bgColor: "bg-bg",
  },
  "생산 중": {
    textColor: "text-purple",
    bgColor: "bg-purple-8",
  },
};

// 진행중인 프로젝트 상태
export type ProjectStatusType =
  | "견적 협의"
  | "생산 대기"
  | "생산 중"
  | "생산 완료"
  | "납품"
  | "프로젝트 완료";
export const ProjectStatusColorMap: Record<
  ProjectStatusType,
  StatusColorModel
> = {
  "견적 협의": { bgColor: "bg-yellow-8", textColor: "text-yellow" },
  "생산 대기": { bgColor: "bg-bg", textColor: "text-dg" },
  "생산 중": { bgColor: "bg-purple-8", textColor: "text-purple" },
  "생산 완료": { bgColor: "bg-primary-8", textColor: "text-primary" },
  납품: { bgColor: "bg-green-8", textColor: "text-green" },
  "프로젝트 완료": { bgColor: "bg-primary-8", textColor: "text-primary" },
};

// 거래명세서 발행 상태
export type TransactionStatusType = "미작성" | "작성 완료";
export const TransactionStatusColorMap: Record<TransactionStatusType, string> =
  {
    미작성: "text-gr",
    "작성 완료": "text-primary",
  };

// 세금계산서 발행 상태
export type TaxStatusType = "미발행" | "발행 중" | "발행 완료";
export const TaxStatusColorMap: Record<TaxStatusType, string> = {
  미발행: "text-gr",
  "발행 중": "text-yellow",
  "발행 완료": "text-primary",
};

// 완료된 프로젝트 상태
export type CompletedProjectStatusType = "완료" | "중단";
export const CompletedProjectStatusColorMap: Record<
  CompletedProjectStatusType,
  StatusColorModel
> = {
  완료: { bgColor: "bg-primary-8", textColor: "text-primary" },
  중단: { bgColor: "bg-red-8", textColor: "text-red" },
};

// production의 설비 가동 상태
export type OperationStatusType =
  | "가동 대기"
  | "가동 중"
  | "가동 완료"
  | "가동 중지";
export const OperationStatusColorMap: Record<
  OperationStatusType,
  StatusColorModel
> = {
  "가동 대기": {
    textColor: "text-dg",
    bgColor: "bg-bg",
    hover: "hover:bg-gray-100",
  },
  "가동 중": {
    textColor: "text-purple",
    bgColor: "bg-purple-8",
    hover: "hover:bg-purple-hover",
  },
  "가동 완료": {
    textColor: "text-primary",
    bgColor: "bg-primary-8",
    hover: "hover:bg-secondary-hover",
  },
  "가동 중지": {
    textColor: "text-red",
    bgColor: "bg-red-8",
    hover: "hover:bg-red-hover",
  },
};

// 재고 상태
export type InventoryStatusType = "충분" | "부족";
export const InventoryStatusColorMap: Record<
  InventoryStatusType,
  StatusColorModel
> = {
  충분: { textColor: "text-primary", bgColor: "bg-primary-8" },
  부족: { textColor: "text-red", bgColor: "bg-red-8" },
};

// 세금계산서 종류
export type TaxDocumentType = "매출" | "매입";
export const TaxDocumentTypeColorMap: Record<
  TaxDocumentType,
  StatusColorModel
> = {
  매출: { bgColor: "bg-primary-8", textColor: "text-primary" },
  매입: { bgColor: "bg-red-8", textColor: "text-red" },
};
