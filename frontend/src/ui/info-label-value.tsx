import Chip from "./chip";
import { StatusType, statusColorMap } from "@/types/status-type";

interface InfoLabelValueProps {
  label: string;
  value?: string;
  chip?: {
    status: StatusType;
  };
}

const InfoLabelValue = ({ label, value, chip }: InfoLabelValueProps) => {
  const colors = chip ? statusColorMap[chip.status] : null;

  return (
    <div className="flex w-full Me_Body-1">
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
