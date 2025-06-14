export type FacilityStatus = "가동중" | "가동 대기";

export type FacilityTableItemProps = {
  status: FacilityStatus;
  name: string;
  products: string;
  priority: number;
};

export const statusColorMap: Record<
  FacilityStatus,
  { bgColor: string; textColor: string }
> = {
  가동중: { bgColor: "bg-purple-8", textColor: "text-purple" },
  "가동 대기": { bgColor: "bg-bg", textColor: "text-dg" },
};
