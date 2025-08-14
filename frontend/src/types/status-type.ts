// 상태별 색상 모델 인터페이스
export interface StatusColorModel {
  bgColor: string;
  textColor: string;
  hover?: string;
}

// 팩토리 멤버 type
export type MemberRoleType =
  | 'admin'
  | 'manager'
  | 'viewer'
  | '시스템 관리자'
  | '운영자'
  | '조회자'
  | '관리자'; // 시스템 관리자, 운영자, 조회자
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
  | 'confirmed'
  | 'pending'
  | 'production'
  | 'manufactured'
  | 'delivery'
  | 'completed'
  | 'suspended'
  // 한글 상태 추가
  | '견적 협의중'
  | '주문 확정'
  | '생산 대기'
  | '생산 중'
  | '생산 완료'
  | '납품'
  | '프로젝트 완료'
  | '완료'
  | '중단';

// | '견적 협의' // quotation
// | '주문 확정' // confirmed
// | '생산 대기' // pending
// | '생산 중' // production
// | '생산 완료' // manufactured
// | '납품' // delivery
// | '프로젝트 완료' // completed
// | '중단'; // suspended

export const ProjectStatusMap: Record<ProjectStatusType, string> = {
  quotation: '견적 요청',
  confirmed: '주문 확정',
  pending: '생산 대기',
  production: '생산 중',
  manufactured: '생산 완료',
  delivery: '납품',
  completed: '프로젝트 완료',
  suspended: '중단',
  // Korean status mappings
  '견적 협의중': '견적 협의중',
  '주문 확정': '주문 확정',
  '생산 대기': '생산 대기',
  '생산 중': '생산 중',
  '생산 완료': '생산 완료',
  납품: '납품',
  '프로젝트 완료': '프로젝트 완료',
  완료: '완료',
  중단: '중단',
};

export const ProjectStatusColorMap: Record<string, StatusColorModel> = {
  // 영어 상태
  quotation: { bgColor: 'bg-yellow-8', textColor: 'text-yellow' },
  confirmed: { bgColor: 'bg-[#FF6C17]/8', textColor: 'text-[#FF6C17]' },
  pending: { bgColor: 'bg-bg', textColor: 'text-dg' },
  production: { bgColor: 'bg-purple-8', textColor: 'text-purple' },
  manufactured: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  delivery: { bgColor: 'bg-green-8', textColor: 'text-green' },
  completed: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  suspended: { bgColor: 'bg-red-8', textColor: 'text-red' },

  // 한글 상태 (기존 호환성 유지)
  '견적 협의중': { bgColor: 'bg-yellow-8', textColor: 'text-yellow' },
  '주문 확정': { bgColor: 'bg-[#FF6C17]/8', textColor: 'text-[#FF6C17]' },
  '생산 대기': { bgColor: 'bg-bg', textColor: 'text-dg' },
  '생산 중': { bgColor: 'bg-purple-8', textColor: 'text-purple' },
  '생산 완료': { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  납품: { bgColor: 'bg-green-8', textColor: 'text-green' },
  '프로젝트 완료': { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  완료: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  중단: { bgColor: 'bg-red-8', textColor: 'text-red' },
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

// 세금계산서 발행 상태
export type TaxStatusType = null | '' | 'pending' | 'published';
// 미발행 // 발행 대기 // 발행 완료

// 재고 상태
export type InventoryStatusType = '충분' | '부족';
export const InventoryStatusColorMap: Record<
  InventoryStatusType,
  StatusColorModel
> = {
  충분: { textColor: 'text-primary', bgColor: 'bg-primary-8' },
  부족: { textColor: 'text-red', bgColor: 'bg-red-8' },
};

// 프로젝트 로그 타입
export type ProjectLogType = 'memo' | 'refund' | 'plan';
// memo: 메모 // refund: 반품 // plan: 계획 변경

// 알림 타입
export type NotificationType = 'warning' | 'information' | 'completed';
// 경고 // 정보 // 완료

// 알림 사유
export type NotificationCaseType =
  | 'material_lack' // 자재 부족
  | 'project_warning' // 프로젝트 생산 계획 이상
  | 'product_completed' // 제품 생산 완료
  | 'sales_tax_invoice_published' // 매출 세금계산서 발행 완료
  | 'purchase_tax_invoice_published' // 매입 세금계산서 발행 완료
  | 'cash_receipt_published' // 영수증 발행 완료
  | 'permission_changed' // 권한 변경
  | 'due_date_approaching' // 납기일 임박
  | 'production_schedule_changed'; // 생산 일정 변경

// 세금계산서 종류
export type TaxDocumentType = '매출' | '매입'; // sales, purchase
export const TaxDocumentTypeColorMap: Record<
  TaxDocumentType,
  StatusColorModel
> = {
  매출: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
  매입: { bgColor: 'bg-red-8', textColor: 'text-red' },
};

export type TransactionType = '영수' | '청구'; // receipt, invoice
// export const TransactionTypeColorMap: Record<
//   TransactionType,
//   StatusColorModel
// > = {
//   영수: { bgColor: 'bg-primary-8', textColor: 'text-primary' },
//   청구: { bgColor: 'bg-red-8', textColor: 'text-red' },
// };

export type TaxPublishStatusType = '임시 저장' | '발행 대기' | '발행 완료'; // temporary, pending, published
export const TaxPublishStatusColorMap: Record<
  TaxPublishStatusType,
  StatusColorModel
> = {
  '임시 저장': { textColor: 'text-primary', bgColor: 'bg-bg' },
  '발행 대기': { textColor: 'text-dg', bgColor: 'bg-bg' },
  '발행 완료': { textColor: 'text-primary', bgColor: 'bg-primary-8' },
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

// production의 설비 가동 상태
export type OperationStatusType = '가동 대기' | '가동 중' | '가동 완료';
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

// 세금계산서 임시보관함 상태
export type TaxDraftStatusType = '임시 저장' | '발행 대기';
export const TaxDraftStatusColorMap: Record<
  TaxDraftStatusType,
  StatusColorModel
> = {
  '임시 저장': { textColor: 'text-primary', bgColor: 'bg-bg' },
  '발행 대기': { textColor: 'text-dg', bgColor: 'bg-bg' },
};
