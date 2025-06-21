import { ProjectStatusType } from "@/types/status-type";

export interface ProjectDataModel {
  id: number;
  status: ProjectStatusType;
  companyName: string;
  items: string;
  startDate: string;
  endDate: string;
  transactionIssued: "미작성" | "작성 완료";
  taxIssued: "미발행" | "발행 중" | "발행 완료";
}

export const projectData: ProjectDataModel[] = [
  {
    id: 1,
    status: "생산 중",
    companyName: "테크파츠",
    items: "M8 볼트 세트",
    startDate: "2025-06-06",
    endDate: "2025-06-11",
    transactionIssued: "미작성",
    taxIssued: "미발행",
  },
  {
    id: 2,
    status: "생산 완료",
    companyName: "에이스정밀",
    items: "금형 케이스",
    startDate: "2025-06-04",
    endDate: "2025-06-15",
    transactionIssued: "미작성",
    taxIssued: "미발행",
  },
  {
    id: 3,
    status: "생산 대기",
    companyName: "에이스정밀",
    items: "성일 부품 외 2개",
    startDate: "2025-06-12",
    endDate: "2025-06-11",
    transactionIssued: "미작성",
    taxIssued: "미발행",
  },
  {
    id: 4,
    status: "납품",
    companyName: "디이몰드",
    items: "테스크 키트 외 1개",
    startDate: "2025-06-04",
    endDate: "2025-06-10",
    transactionIssued: "작성 완료",
    taxIssued: "발행 중",
  },
  {
    id: 5,
    status: "견적 협의",
    companyName: "다이몰드",
    items: "정밀 부품 외 2개",
    startDate: "-",
    endDate: "2025-06-15",
    transactionIssued: "미작성",
    taxIssued: "미발행",
  },
  {
    id: 6,
    status: "생산 중",
    companyName: "금형마스터",
    items: "금형 케이스",
    startDate: "2025-06-04",
    endDate: "2025-06-13",
    transactionIssued: "미작성",
    taxIssued: "미발행",
  },
  {
    id: 7,
    status: "납품",
    companyName: "플라스틱이 좋아",
    items: "플라스틱 컵 외 3개",
    startDate: "2025-06-08",
    endDate: "2025-06-14",
    transactionIssued: "미작성",
    taxIssued: "미발행",
  },
];
