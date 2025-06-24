import { NotificationModel } from "@/app/(with-layout)/dashboard/types";

export const notificationData: NotificationModel[] = [
  {
    id: 1,
    type: "materialShortage",
    message: "플라스틱 고리 원자재 부족",
    date: "2025-06-06",
  },
  {
    id: 2,
    type: "importDelay",
    message: "알루미늄 부품 입고가 지연되고 있습니다.",
    date: "2025-06-06",
  },
  {
    id: 3,
    type: "deliveryDate",
    message: "알루미늄 싱어 프로젝트 납기 3일 전입니다.",
    date: "2025-06-06",
  },
  {
    id: 4,
    type: "return",
    message: "나무사랑 생산 반품이 접수되었습니다.",
    date: "2025-06-06",
  },
  {
    id: 5,
    type: "taxIssue",
    message: "세금계산서 미발행 1건이 있습니다.",
    date: "2025-06-06",
  },
  {
    id: 6,
    type: "debt",
    message: "정산 누락 건이 있습니다.",
    date: "2025-06-06",
  },
  {
    id: 7,
    type: "scheduleConflict",
    message: "동일 시간에 설비/인력이 중복 배정되었습니다.",
    date: "2025-06-06",
  },
];
