export type StatusType = "충분" | "부족";

export const statusColorMap: Record<
  StatusType,
  { textColor: string; bgColor: string }
> = {
  충분: { textColor: "text-primary", bgColor: "bg-primary-8" },
  부족: { textColor: "text-red", bgColor: "bg-red-8" },
};

export type OperationStatusType = "가동 대기" | "가동 중" | "가동 완료";

export const operationStatusColorMap: Record<
  OperationStatusType,
  { textColor: string; bgColor: string }
> = {
  "가동 대기": { textColor: "text-dg", bgColor: "bg-bg" },
  "가동 중": { textColor: "text-purple", bgColor: "bg-purple-8" },
  "가동 완료": { textColor: "text-primary", bgColor: "bg-primary-8" },
};
