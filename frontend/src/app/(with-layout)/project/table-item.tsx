import Chip from "@/ui/chip";
import {
  StatusType,
  StatusColorType,
  statusColorMap,
} from "@/app/(with-layout)/project/types";

interface TableItemProps {
  status: StatusType;
  companyName: string;
  items: string;
  startDate: string;
  endDate: string;
}

const TableItem = ({
  status,
  companyName,
  items,
  startDate,
  endDate,
}: TableItemProps) => {
  const chipColors: StatusColorType = statusColorMap[status];

  return (
    <div className="flex items-center h-14 border-b border-[#eeeeee] Me_Body-1">
      <div className="flex items-center py-3 px-2">
        <input type="checkbox" className="w-4 h-4 border-sv" />
      </div>
      <div className="py-1 px-3 w-[150px]">
        <Chip
          text={status}
          bgColor={chipColors.bgColor}
          textColor={chipColors.textColor}
        />
      </div>
      <p className="flex-1 py-1 px-3 text-dg">{companyName}</p>
      <p className="flex-1 py-1 px-3 text-dg">{items}</p>
      <p className="w-[200px] py-1 px-3 text-dg">{startDate}</p>
      <p className="w-[200px] py-1 px-3 text-dg">{endDate}</p>
    </div>
  );
};

export default TableItem;
