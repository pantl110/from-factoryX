import Chip from "./chip";
import {
  InventoryStatusType,
  InventoryStatusColorMap,
  TaxDocumentType,
  TaxDocumentTypeColorMap,
} from "@/types/status-type";
import {
  FacilityStatusType,
  FacilityStatusColorMap,
} from "@/app/(with-layout)/setting/master-data/facility/types";
import { ReactNode, ChangeEvent } from "react";

interface InfoLabelValueProps {
  label: string;
  value?: ReactNode;
  chip?: {
    status: InventoryStatusType | TaxDocumentType | FacilityStatusType;
  };
  isEditing?: boolean;
  placeholder?: string;
  onValueChange?: (value: string) => void;
}

const InfoLabelValue = ({
  label,
  value,
  chip,
  isEditing = false,
  placeholder,
  onValueChange,
}: InfoLabelValueProps) => {
  const colors = chip
    ? chip.status in TaxDocumentTypeColorMap
      ? TaxDocumentTypeColorMap[chip.status as TaxDocumentType]
      : chip.status in FacilityStatusColorMap
        ? FacilityStatusColorMap[chip.status as FacilityStatusType]
        : InventoryStatusColorMap[chip.status as InventoryStatusType]
    : null;

  const renderContent = () => {
    // 수정 모드인 경우
    if (isEditing) {
      return (
        <input
          defaultValue={typeof value === "string" ? value : ""}
          placeholder={placeholder}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onValueChange?.(e.target.value)
          }
          className="w-full"
        />
      );
    }

    // chip이 있는 경우
    if (chip && colors) {
      return (
        <Chip
          text={chip.status}
          bgColor={colors.bgColor}
          textColor={colors.textColor}
          sm={true}
        />
      );
    }
    return value;
  };

  return (
    <div className="flex w-full Me_Body-1 border-t border-lg">
      <div className="w-[134px] bg-lg-table">
        <div className="text-sv p-3">{label}</div>
      </div>
      <div className="flex-1">
        <div className="text-dg p-3">{renderContent()}</div>
      </div>
    </div>
  );
};

export default InfoLabelValue;
