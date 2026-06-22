// 상태별 색상 모델 인터페이스
export interface StatusColorModel {
  bgColor?: string;
  textColor?: string;
  hover?: string;
  color?:
    | 'red'
    | 'orange'
    | 'purple'
    | 'green'
    | 'yellow'
    | 'gray'
    | 'white'
    | 'whiteOutline'
    | 'blue'
    | 'primary';
}

// 팩토리 멤버 type
export type MemberRoleType = 'admin' | 'manager' | 'viewer' | 'prod_manager';
export type MemberStatusType = 'invited' | 'active'; // 초대됨, 활성
export const MemberRoleColorMap: Record<MemberRoleType, StatusColorModel> = {
  admin: { bgColor: 'bg-purple-8', textColor: 'text-purple', color: 'purple' },
  manager: {
    bgColor: 'bg-blue-8',
    textColor: 'text-blue',
    color: 'blue',
  },
  viewer: { bgColor: 'bg-yellow-8', textColor: 'text-yellow', color: 'yellow' },
  prod_manager: {
    bgColor: 'bg-green-8',
    textColor: 'text-green',
    color: 'green',
  },
};

// 설비 상태 // 설정 페이지
export type EquipmentStatusType = 'standby' | 'running'; // 가동 대기 / 가동 중
export const EquipmentStatusColorMap: Record<
  EquipmentStatusType,
  StatusColorModel
> = {
  standby: { textColor: 'text-dg', bgColor: 'bg-bg', color: 'gray' },
  running: {
    textColor: 'text-purple',
    bgColor: 'bg-purple-8',
    color: 'purple',
  },
};

// 거래처 유형 // 설정 페이지
export type ClientType = 'supplier' | 'customer'; // 발주처 | 수주처
export const ClientTypeColorMap: Record<
  ClientType,
  { bgColor: string; textColor: string }
> = {
  supplier: { bgColor: 'bg-red-8', textColor: 'text-red' },
  customer: { bgColor: 'bg-green-8', textColor: 'text-primary' },
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
  | 'suspended';

// | '견적 협의' // quotation
// | '주문 확정' // confirmed
// | '생산 대기' // pending
// | '생산 중' // production
// | '생산 완료' // manufactured
// | '납품' // delivery
// | '프로젝트 완료' // completed
// | '중단'; // suspended

// 프로젝트 상태 표시 텍스트는 messages의 번역 키로 처리한다.

export const ProjectStatusColorMap: Record<string, StatusColorModel> = {
  // 영어 상태
  quotation: {
    bgColor: 'bg-yellow-8',
    textColor: 'text-yellow',
    color: 'yellow',
  },
  confirmed: {
    bgColor: 'bg-[#FF6C17]/8',
    textColor: 'text-[#FF6C17]',
    color: 'orange',
  },
  pending: { bgColor: 'bg-bg', textColor: 'text-dg', color: 'gray' },
  production: {
    bgColor: 'bg-purple-8',
    textColor: 'text-purple',
    color: 'purple',
  },
  manufactured: { bgColor: 'bg-blue-8', textColor: 'text-blue', color: 'blue' },
  delivery: { bgColor: 'bg-green-8', textColor: 'text-green', color: 'green' },
  completed: { bgColor: 'bg-primary', textColor: 'text-wh', color: 'primary' },
  suspended: { bgColor: 'bg-red-8', textColor: 'text-red', color: 'red' },

  // 한글 상태 (기존 호환성 유지)
  '견적 협의중': {
    bgColor: 'bg-yellow-8',
    textColor: 'text-yellow',
    color: 'yellow',
  },
  '주문 확정': {
    bgColor: 'bg-[#FF6C17]/8',
    textColor: 'text-[#FF6C17]',
    color: 'orange',
  },
  '생산 대기': { bgColor: 'bg-bg', textColor: 'text-dg', color: 'gray' },
  '생산 중': {
    bgColor: 'bg-purple-8',
    textColor: 'text-purple',
    color: 'purple',
  },
  '생산 완료': { bgColor: 'bg-blue-8', textColor: 'text-blue', color: 'blue' },
  납품: { bgColor: 'bg-green-8', textColor: 'text-green', color: 'green' },
  '프로젝트 완료': {
    bgColor: 'bg-primary',
    textColor: 'text-wh',
    color: 'primary',
  },
  완료: { bgColor: 'bg-primary', textColor: 'text-wh', color: 'primary' },
  중단: { bgColor: 'bg-red-8', textColor: 'text-red', color: 'red' },
};

// 완료된 프로젝트 상태
export type CompletedProjectStatusType = '완료' | '중단';
export const CompletedProjectStatusColorMap: Record<
  CompletedProjectStatusType,
  StatusColorModel
> = {
  완료: { bgColor: 'bg-green-8', textColor: 'text-primary' },
  중단: { bgColor: 'bg-red-8', textColor: 'text-red' },
};

// 재고 상태
export type InventoryStatusType = '과재고' | '충분' | '위험' | '부족';
export const InventoryStatusColorMap: Record<
  InventoryStatusType,
  StatusColorModel
> = {
  과재고: { textColor: 'text-red', bgColor: 'bg-red-8', color: 'red' },
  충분: {
    textColor: 'text-blue',
    bgColor: 'bg-blue-8',
    color: 'blue',
  },
  위험: { textColor: 'text-orange', bgColor: 'bg-orange-8', color: 'orange' },
  부족: { textColor: 'text-red', bgColor: 'bg-red-8', color: 'red' },
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
export type TaxDocumentType = 'sales' | 'purchase'; // 매출, 매입
export const TaxDocumentTypeColorMap: Record<
  TaxDocumentType,
  StatusColorModel
> = {
  sales: {
    bgColor: 'bg-blue-8',
    textColor: 'text-blue',
    color: 'blue',
  },
  purchase: { bgColor: 'bg-red-8', textColor: 'text-red', color: 'red' },
};

export type TransactionType = 'receipt' | 'invoice'; // 영수, 청구
// export const TransactionTypeColorMap: Record<
//   TransactionType,
//   StatusColorModel
// > = {
//   영수: { bgColor: 'bg-green-8', textColor: 'text-primary' },
//   청구: { bgColor: 'bg-red-8', textColor: 'text-red' },
// };

// 세금계산서 발행 상태
export type TaxStatusType =
  | null
  | 'temporary'
  | 'pending'
  | 'processing'
  | 'published'
  | 'cancled'
  | 'failed';
// 임시 저장 // 전송 대기 // 처리 중 // 발행 완료 // 발행 취소 // 발행 실패
export const TaxStatusColorMap: Record<
  NonNullable<TaxStatusType>,
  StatusColorModel
> = {
  temporary: { textColor: 'text-gr', color: 'gray' },
  pending: { textColor: 'text-yellow', color: 'yellow' },
  processing: { textColor: 'text-purple', color: 'purple' },
  published: { textColor: 'text-blue', color: 'blue' },
  cancled: { textColor: 'text-red', color: 'red' },
  failed: { textColor: 'text-red', color: 'red' },
};

// Helper function to get status color with null handling
export const getTaxStatusColor = (status: TaxStatusType): StatusColorModel => {
  if (!status) return { textColor: 'text-dg', color: 'gray' };
  return TaxStatusColorMap[status];
};

// 발송여부(세금계산서 발송 횟수) 색: 0회=gray, 1회 이상=blue
export const getInvoiceSentColor = (sentCount: number): StatusColorModel =>
  sentCount === 0
    ? { textColor: 'text-dg', color: 'gray' }
    : { textColor: 'text-blue', color: 'blue' };

// Tax Invoice State Types
// 바로빌 상태 (백엔드에서 실제로 사용하는 값들만)
export type BarobillStateType = '임시저장' | '발급완료' | '전송완료';

// 국세청 전송 상태 (백엔드에서 실제로 사용하는 값들만)
export type NtsSendStateType = '전송전' | '전송완료';

// 구독 관련
export type PaymentStatusType = 'PENDING' | 'DONE' | 'CANCELED' | 'FAILED';
// ("PENDING", "대기중"),
// ("DONE", "완료"),
// ("CANCELED", "취소"),
// ("FAILED", "실패"),

export type SubscriptionStatusType = 'trial' | 'basic' | 'partners';

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
export type OperationStatusType = 'pending' | 'production' | 'completed';
export const OperationStatusColorMap: Record<
  OperationStatusType,
  StatusColorModel
> = {
  pending: {
    textColor: 'text-dg',
    bgColor: 'bg-bg',
    hover: 'hover:bg-lg',
  },
  production: {
    textColor: 'text-purple',
    bgColor: 'bg-purple-8',
    hover: 'hover:bg-purple-hover',
  },
  completed: {
    textColor: 'text-primary',
    bgColor: 'bg-green-8',
    hover: 'hover:bg-secondary-hover',
  },
};
// 가동 대기 // 가동 중 // 가동 완료

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
    bgColor: 'bg-green-8',
  },
};

// 세금계산서 임시보관함 상태
export type TaxDraftStatusType = '임시 저장' | '전송 대기';
export const TaxDraftStatusColorMap: Record<
  TaxDraftStatusType,
  StatusColorModel
> = {
  '임시 저장': { textColor: 'text-primary', bgColor: 'bg-bg' },
  '전송 대기': { textColor: 'text-dg', bgColor: 'bg-bg' },
};

// 원자재 상태
export type MaterialStatusType = '과재고' | '충분' | '위험' | '부족';
export const MaterialStatusTypeColorMap: Record<
  MaterialStatusType,
  StatusColorModel
> = {
  과재고: {
    color: 'red',
  },
  충분: { color: 'blue' },
  위험: { color: 'orange' },
  부족: { color: 'red' },
};

// 유통기한 상태
export type ExpiryStatusType = 'warning' | 'safe';
export const ExpiryStatusColorMap: Record<ExpiryStatusType, StatusColorModel> =
  {
    warning: { textColor: 'text-red', bgColor: 'bg-red-8', color: 'red' },
    safe: {
      textColor: 'text-blue',
      bgColor: 'bg-blue-8',
      color: 'blue',
    },
  };

// 채권채무 상태
export type AccountsStatusType =
  | 'waiting'
  | 'partial'
  | 'completed'
  | 'overdue';
// 채권채무 상태 표시 텍스트는 messages의 tax.list.status 번역 키로 처리한다.
export const AccountsStatusColorMap: Record<
  AccountsStatusType,
  StatusColorModel
> = {
  waiting: { textColor: 'text-dg', bgColor: 'bg-bg', color: 'gray' },
  partial: {
    textColor: 'text-orange',
    bgColor: 'bg-orange-8',
    color: 'orange',
  },
  completed: {
    textColor: 'text-blue',
    bgColor: 'bg-blue-8',
    color: 'blue',
  },
  overdue: { textColor: 'text-red', bgColor: 'bg-red-8', color: 'red' },
};

export const getAccountsStatusColor = (
  status: string | null | undefined
): NonNullable<StatusColorModel['color']> =>
  AccountsStatusColorMap[status as AccountsStatusType]?.color || 'gray';

// 세금계산서 채권/채무 수금 조건
export type CollectionTermsType = 'INVOICE_30' | 'INVOICE_EOM_NEXT' | 'CUSTOM';
