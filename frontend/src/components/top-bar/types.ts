export type NotificationType =
  | 'materialShortage' // 원자재 부족
  | 'facilityIssue' // 설비 이상: 가동 불가 등
  | 'productionIssue' // 생산 계획에 이상: 테이블에 빨간 색상
  | 'productionComplete' // 생산 완료
  | 'salesTaxIssued' // 매출 세금계산서 발행
  | 'purchaseTaxReceived' // 매입 세금계산서 들어옴 (API)
  | 'receiptReceived' // 현금영수증 들어옴 (API)
  | 'roleChanged' // 권한 변경
  | 'deliveryDate' // 납기일이 3일 남았을 때
  | 'productionPlanChanged'; // 생산 계획 변경

export interface NotificationModel {
  id: number;
  type: NotificationType;
  message: string;
  date: string;
  isRead?: boolean; // 읽음 상태
}

// top-bar crumb 타입
// production page tab 타입
export type ProductionTabType =
  | '세금계산서'
  | '거래명세서'
  | '납품'
  | '생산 현황'
  | '생산 내역'
  | '생산 계획'
  | '주문서';

// setting page tab 타입
export type StockTabType = 'product' | 'material';

export type SettingTabType = 'system' | 'master';
export type SettingChipType =
  | 'general'
  | 'permission'
  | 'subscription'
  | 'equipment'
  | 'client'
  | 'unit';
