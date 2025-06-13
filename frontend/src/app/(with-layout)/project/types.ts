export type StatusType = "견적협의" | "생산 대기" | "생산 중" | "완료" | "납품";

export type StatusColorType = {
  bgColor: string;
  textColor: string;
};

export const statusColorMap: Record<StatusType, StatusColorType> = {
  견적협의: { bgColor: "bg-yellow-8", textColor: "text-yellow" },
  "생산 대기": { bgColor: "bg-lg-table", textColor: "text-bl" },
  "생산 중": { bgColor: "bg-purple-8", textColor: "text-purple" },
  완료: { bgColor: "bg-primary-8", textColor: "text-primary" },
  납품: { bgColor: "bg-green-8", textColor: "text-green" },
};
