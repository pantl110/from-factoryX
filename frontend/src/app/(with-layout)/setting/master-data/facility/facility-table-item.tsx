import Chip from "@/ui/chip";
import { FacilityStatusColorMap, FacilityStatusType } from "./types";
import { FacilityDataModel } from "@/mocks/facility-data";

export interface FacilityTableItemProps {
  facility: FacilityDataModel;
  onClick?: () => void;
  isDeleteMode?: boolean;
}

const FacilityTableItem = ({
  facility,
  onClick,
  isDeleteMode,
}: FacilityTableItemProps) => {
  const statusColor = facility.status
    ? FacilityStatusColorMap[facility.status as FacilityStatusType]
    : null;

  return (
    <div
      className="flex h-14 items-center px-3 w-full border-b border-[#eeeeee] Me_Body-1 text-dg hover:bg-bg transition-colors duration-200 cursor-pointer"
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
          text={facility.status as FacilityStatusType}
          bgColor={statusColor?.bgColor}
          textColor={statusColor?.textColor}
          radius="rounded-sm"
        />
      </div>
      <p className="flex-1 px-3">{facility.name}</p>
      <p className="flex-1 px-3">{facility.priority}</p>
      <p className="flex-2 px-3">{facility.location}</p>
    </div>
  );
};

export default FacilityTableItem;
