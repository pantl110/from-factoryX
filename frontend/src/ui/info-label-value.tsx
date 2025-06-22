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

interface InfoLabelValueProps {
  label: string;
  value?: string;
  chip?: {
    status: InventoryStatusType | TaxDocumentType | FacilityStatusType;
  };
}

const InfoLabelValue = ({ label, value, chip }: InfoLabelValueProps) => {
  const colors = chip
    ? chip.status in TaxDocumentTypeColorMap
      ? TaxDocumentTypeColorMap[chip.status as TaxDocumentType]
      : chip.status in FacilityStatusColorMap
        ? FacilityStatusColorMap[chip.status as FacilityStatusType]
        : InventoryStatusColorMap[chip.status as InventoryStatusType]
    : null;

  return (
    <div className="flex w-full Me_Body-1 border-t border-lg">
      <div className="w-[134px] h-full bg-lg-table">
        <div className="text-sv p-3">{label}</div>
      </div>
      <div className="flex-1">
        <div className="text-dg p-3">
          {chip && colors ? (
            <Chip
              text={chip.status}
              bgColor={colors.bgColor}
              textColor={colors.textColor}
              sm={true}
            />
          ) : (
            value
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoLabelValue;
