// 상태별 색상 모델 인터페이스
export interface StatusColorModel {
  bgColor: string;
  textColor: string;
  hover?: string;
}

// 팩토리 멤버 type
export type MemberRoleType = 'admin' | 'manager' | 'viewer'; // 시스템 관리자, 운영자, 조회자
export type MemberStatusType = 'invited' | 'active'; // 초대됨, 활성

// 설비 상태 // 설정 페이지
export type EquipmentStatusType = '가동 대기' | '가동 중';
export const EquipmentStatusColorMap: Record<
  EquipmentStatusType,
  StatusColorModel
> = {
  '가동 대기': { textColor: 'text-dg', bgColor: 'bg-bg' },
  '가동 중': { textColor: 'text-purple', bgColor: 'bg-purple-8' },
};

// 거래처 유형 // 설정 페이지
export type ClientType = 'supplier' | 'customer'; // 발주처 | 수주처
export const ClientTypeColorMap: Record<
  ClientType,
  { bgColor: string; textColor: string }
> = {
  supplier: { bgColor: 'bg-red-8', textColor: 'text-red' },
  customer: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
};

// 프로젝트 상태
export type ProjectStatusType =
  | 'quotation'
  | 'pending'
  | 'production'
  | 'manufactured'
  | 'delivery'
  | 'completed'
  | 'interruption';

// | '견적 협의' // quotation
// | '생산 대기' // pending
// | '생산 중' // production
// | '생산 완료' // manufactured
// | '납품' // delivery
// | '프로젝트 완료' // completed
// | '중단'; // interruption
export const ProjectStatusColorMap: Record<
  ProjectStatusType,
  StatusColorModel
> = {
  quotation: { bgColor: 'bg-yellow-8', textColor: 'text-yellow' },
  pending: { bgColor: 'bg-bg', textColor: 'text-dg' },
  production: { bgColor: 'bg-purple-8', textColor: 'text-purple' },
  manufactured: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  delivery: { bgColor: 'bg-green-8', textColor: 'text-green' },
  completed: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  interruption: { bgColor: 'bg-red-8', textColor: 'text-red' },
};

// 세금계산서 발행 상태
export type TaxStatusType = null | 'temporary' | 'pending' | 'published';
// 세금계산서 미연결(미발행) // 임시 저장(미발행) // 발행 대기 (연결 필요) // 발행 완료(보기)

// 재고 상태
export type InventoryStatusType = '충분' | '부족';
export const InventoryStatusColorMap: Record<
  InventoryStatusType,
  StatusColorModel
> = {
  충분: { textColor: 'text-primary', bgColor: 'bg-primary-8' },
  부족: { textColor: 'text-red', bgColor: 'bg-red-8' },
};

////////////////////
////////////////////
////////////////////
////////////////////
////////////////////
////////////////////
//////////////////s//
// 수정 전, 확인 전, 삭제하기

// 거래명세서 발행 상태
export type TransactionStatusType = '미작성' | '작성 완료';
export const TransactionStatusColorMap: Record<TransactionStatusType, string> =
  {
    미작성: 'text-gr',
    '작성 완료': 'text-primary',
  };

// 완료된 프로젝트 상태
export type CompletedProjectStatusType = '완료' | '중단';
export const CompletedProjectStatusColorMap: Record<
  CompletedProjectStatusType,
  StatusColorModel
> = {
  완료: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  중단: { bgColor: 'bg-red-8', textColor: 'text-red' },
};

// production의 설비 가동 상태
export type OperationStatusType =
  | '가동 대기'
  | '가동 중'
  | '가동 완료'
  | '가동 중지';
export const OperationStatusColorMap: Record<
  OperationStatusType,
  StatusColorModel
> = {
  '가동 대기': {
    textColor: 'text-dg',
    bgColor: 'bg-bg',
    hover: 'hover:bg-lg',
  },
  '가동 중': {
    textColor: 'text-purple',
    bgColor: 'bg-purple-8',
    hover: 'hover:bg-purple-hover',
  },
  '가동 완료': {
    textColor: 'text-primary',
    bgColor: 'bg-primary-8',
    hover: 'hover:bg-secondary-hover',
  },
  '가동 중지': {
    textColor: 'text-red',
    bgColor: 'bg-red-8',
    hover: 'hover:bg-red-hover',
  },
};

// 납품 상태
export type DeliveryStatusType = '예정' | '완료';
export const DeliveryStatusColorMap: Record<
  DeliveryStatusType,
  StatusColorModel
> = {
  예정: {
    textColor: 'text-bl',
    bgColor: 'bg-bg',
  },
  완료: {
    textColor: 'text-primary',
    bgColor: 'bg-primary-8',
  },
};

// 세금계산서 종류
export type TaxDocumentType = '매출' | '매입';
export const TaxDocumentTypeColorMap: Record<
  TaxDocumentType,
  StatusColorModel
> = {
  매출: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  매입: { bgColor: 'bg-red-8', textColor: 'text-red' },
};

// 세금계산서 임시보관함 상태
export type TaxDraftStatusType = '임시 저장' | '발행 대기';
export const TaxDraftStatusColorMap: Record<
  TaxDraftStatusType,
  StatusColorModel
> = {
  '임시 저장': { textColor: 'text-primary', bgColor: 'bg-bg' },
  '발행 대기': { textColor: 'text-dg', bgColor: 'bg-bg' },
};
