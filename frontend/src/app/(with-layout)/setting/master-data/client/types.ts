export type ClientType = "발주처" | "수주처";

export const ClientTypeColorMap: Record<
  ClientType,
  { bgColor: string; textColor: string }
> = {
  발주처: { bgColor: "bg-red-8", textColor: "text-red" },
  수주처: { bgColor: "bg-primary-8", textColor: "text-primary" },
};
