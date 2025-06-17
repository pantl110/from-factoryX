export type StatusType = "충분" | "부족";

export const statusColorMap: Record<
  StatusType,
  { textColor: string; bgColor: string }
> = {
  충분: { textColor: "text-primary", bgColor: "bg-primary-8" },
  부족: { textColor: "text-red", bgColor: "bg-red-8" },
};
