import { CompletedProjectStatusType } from "@/types/status-type";

export interface CompletedProjectDataModel {
  id: number;
  status: CompletedProjectStatusType; // "완료" | "중단"
  companyName: string;
  items: string;
  date: string;
}

const completedProjectData: CompletedProjectDataModel[] = [
  {
    id: 1,
    status: "완료",
    companyName: "플라스틱이 좋아",
    items: "플라스틱 컵 외 3개",
    date: "2025-06-31",
    isTransactionIssued: "미작성",
    isTaxIssued: "미발행",
  },
  {
    id: 2,
    status: "완료",
    companyName: "다이몰드",
    items: "금형케이스",
    date: "2024-06-30",
    isTransactionIssued: "미작성",
    isTaxIssued: "미발행",
  },
  {
    id: 3,
    status: "완료",
    companyName: "금형마스터",
    items: "정밀 부품 외 2개",
    date: "2025-06-31",
    isTransactionIssued: false,
    isTaxIssued: false,
  },
  {
    id: 4,
    status: "중단",
    companyName: "테크파츠",
    items: "M8 볼트 세트",
    date: "2025-06-31",
    isTransactionIssued: false,
    isTaxIssued: false,
  },
];

export default completedProjectData;
