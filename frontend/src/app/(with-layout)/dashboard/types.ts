export type NotificationType =
  | "materialShortage" // 원자재 부족
  | "importDelay" // 입고 지연: 원자재 입고가 지연
  | "deliveryDate" // 납기일: 품목납기일이 다가올 때
  | "return" // 반품: 반품이 들어왔을 때
  | "taxIssue" // 세금 이슈: 미발행 세금계산서, 납부 누락
  | "debt" // 미수금/미지급: 정산누락, 입금 지연 등
  | "scheduleConflict"; // 일정 충돌: 같은 시간에 설비/인력이 중복

export interface NotificationModel {
  id: number;
  type: NotificationType;
  message: string;
  date: string;
}
