// 상태별 색상 모델 인터페이스
export interface StatusColorModel {
  bgColor: string;
  textColor: string;
}

// 디자인팀 확인 필요// dashboard 생산 상태
export type ProductionStatusType = "생산완료" | "가동대기" | "생산 중";

export const ProductionStatusColorMap: Record<
  ProductionStatusType,
  StatusColorModel
> = {
  생산완료: {
    textColor: "text-primary",
    bgColor: "bg-primary-8",
  },
  가동대기: {
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
  | "납품";

export const ProjectStatusColorMap: Record<
  ProjectStatusType,
  StatusColorModel
> = {
  "견적 협의": { bgColor: "bg-yellow-8", textColor: "text-yellow" },
  "생산 대기": { bgColor: "bg-lg-table", textColor: "text-bl" },
  "생산 중": { bgColor: "bg-purple-8", textColor: "text-purple" },
  "생산 완료": { bgColor: "bg-primary-8", textColor: "text-primary" },
  납품: { bgColor: "bg-green-8", textColor: "text-green" },
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

// 설비 가동 상태
export type OperationStatusType = "가동대기" | "가동중" | "가동완료";

export const OperationStatusColorMap: Record<
  OperationStatusType,
  StatusColorModel
> = {
  가동대기: { textColor: "text-dg", bgColor: "bg-bg" },
  가동중: { textColor: "text-purple", bgColor: "bg-purple-8" },
  가동완료: { textColor: "text-primary", bgColor: "bg-primary-8" },
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

// 문서함 종류
export type DocumentType =
  | "주문서"
  | "생산지시서"
  | "거래명세서"
  | "매출 세금계산서"
  | "매입 세금계산서";

export const DocumentTypeColorMap: Record<DocumentType, StatusColorModel> = {
  주문서: { bgColor: "bg-yellow-8", textColor: "text-yellow" },
  생산지시서: { bgColor: "bg-purple-8", textColor: "text-purple" },
  거래명세서: { bgColor: "bg-green-8", textColor: "text-green" },
  "매출 세금계산서": { bgColor: "bg-primary-8", textColor: "text-primary" },
  "매입 세금계산서": { bgColor: "bg-red-8", textColor: "text-red" },
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
