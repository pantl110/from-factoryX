export type LogType = "memo" | "return" | "planChange";

export interface LogDataModel {
  id: number;
  type: LogType;
  title: string;
  content: string;
  createdAt: string;
}

export const logData: LogDataModel[] = [
  {
    id: 1,
    type: "memo",
    title: "금형 온도 세팅 주의",
    content: "설비가 이상하다. 한 번 확인 필요!",
    createdAt: "3시간 전",
  },
  {
    id: 2,
    type: "return",
    title: "반품 접수 현황",
    content: "플라스틱 부품 A (φ20×30) 5개가 반품되었습니다.",
    createdAt: "3시간 전",
  },
  {
    id: 3,
    type: "planChange",
    title: "사용설비 변경",
    content: "사용설비가 A라인에서 B라인으로 변경되었습니다.",
    createdAt: "3시간 전",
  },
  {
    id: 4,
    type: "memo",
    title: "금형 온도 세팅 주의",
    content: "설비가 이상하다. 한 번 확인 필요!",
    createdAt: "3시간 전",
  },
  {
    id: 5,
    type: "memo",
    title: "금형 온도 세팅 주의",
    content: "설비가 이상하다. 한 번 확인 필요!",
    createdAt: "3시간 전",
  },
  {
    id: 6,
    type: "memo",
    title: "금형 온도 세팅 주의",
    content: "설비가 이상하다. 한 번 확인 필요!",
    createdAt: "3시간 전",
  },
];
