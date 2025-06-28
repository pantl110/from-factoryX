import Chip from "./chip";
import React, { ChangeEvent, ReactNode } from "react";
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

interface InfoLabelValueProps {
  label: string;
  value?: ReactNode;
  chip?: {
    status: InventoryStatusType | TaxDocumentType | FacilityStatusType;
  };
  isEditing?: boolean;
  placeholder?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  inputType?: string;
  unit?: string;
}

const InfoLabelValue = ({
  label,
  value,
  chip,
  isEditing = false,
  placeholder,
  onChange,
  onFocus,
  onBlur,
  inputType = "text",
  unit,
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
        <div className="flex items-center w-full">
          <input
            type={inputType}
            defaultValue={typeof value === "string" ? value : ""}
            placeholder={placeholder}
            onChange={onChange}
            className="w-full"
            style={{ outline: "none" }}
            onFocus={onFocus}
            onBlur={onBlur}
          />
          {unit && <span className="ml-1 text-dg">{unit}</span>}
        </div>
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
