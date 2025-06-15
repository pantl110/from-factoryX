import { StatusType } from "@/app/(with-layout)/project/types";

export interface ProjectData {
  id: number;
  status: StatusType;
  companyName: string;
  items: string;
  startDate: string;
  endDate: string;
}

export const projectData: ProjectData[] = [
  {
    id: 1,
    status: "견적협의",
    companyName: "플라스틱이 좋아",
    items: "플라스틱 컵 외 2개",
    startDate: "2024-03-20",
    endDate: "2024-03-25",
  },
  {
    id: 2,
    status: "생산 대기",
    companyName: "메탈월드",
    items: "스테인리스 볼트 외 1개",
    startDate: "2024-03-21",
    endDate: "2024-03-28",
  },
  {
    id: 3,
    status: "생산 중",
    companyName: "우드팩토리",
    items: "나무 상자 외 3개",
    startDate: "2024-03-19",
    endDate: "2024-03-26",
  },
  {
    id: 4,
    status: "완료",
    companyName: "텍스타일",
    items: "면 티셔츠 외 5개",
    startDate: "2024-03-15",
    endDate: "2024-03-22",
  },
  {
    id: 5,
    status: "납품",
    companyName: "전자부품",
    items: "PCB 보드 외 2개",
    startDate: "2024-03-18",
    endDate: "2024-03-25",
  },
];
