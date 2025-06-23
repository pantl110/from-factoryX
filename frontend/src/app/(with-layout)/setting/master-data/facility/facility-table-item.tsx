import Chip from "@/ui/chip";
import { FacilityStatusColorMap, FacilityStatusType } from "./types";

export interface FacilityTableItemProps {
  status: FacilityStatusType;
  name: string;
  priority: number;
  location?: string;
  onClick?: () => void;
}

const FacilityTableItem = ({
  status,
  name,
  priority,
  location,
  onClick,
}: FacilityTableItemProps) => {
  const statusColor = FacilityStatusColorMap[status];
  return (
    <div
      className="flex h-14 items-center px-3 w-full border-b border-[#eeeeee] Me_Body-1 text-dg hover:bg-gray-50 cursor-pointer"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
    >
      <div className="flex-1">
        <Chip
          text={status}
          bgColor={statusColor.bgColor}
          textColor={statusColor.textColor}
          radius="rounded-sm"
        />
      </div>
      <p className="flex-1">{name}</p>
      <p className="flex-1">{priority}</p>
      <p className="flex-2">{location}</p>
    </div>
  );
};

export default FacilityTableItem;
