import Chip from "@/ui/chip";
import { FacilityStatusColorMap, FacilityStatusType } from "./types";

export interface FacilityTableItemProps {
  status: FacilityStatusType;
  name: string;
  priority: number;
  location?: string;
  onClick?: () => void;
  isDeleteMode?: boolean;
}

const FacilityTableItem = ({
  status,
  name,
  priority,
  location,
  onClick,
  isDeleteMode,
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
      {isDeleteMode && (
        <div
          className="flex items-center px-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input type="checkbox" className="w-4 h-4 border-sv" />
        </div>
      )}
      <div className="flex-1 px-3">
        <Chip
          text={status}
          bgColor={statusColor.bgColor}
          textColor={statusColor.textColor}
          radius="rounded-sm"
        />
      </div>
      <p className="flex-1 px-3">{name}</p>
      <p className="flex-1 px-3">{priority}</p>
      <p className="flex-2 px-3">{location}</p>
    </div>
  );
};

export default FacilityTableItem;
