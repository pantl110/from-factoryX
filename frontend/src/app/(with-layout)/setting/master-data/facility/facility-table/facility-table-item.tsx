import Chip from "@/ui/chip";
import { FacilityTableItemProps, statusColorMap } from "./types";

const FacilityTableItem = ({
  status,
  name,
  products,
  priority,
}: FacilityTableItemProps) => {
  return (
    <div className="flex h-14 items-center py-1 px-3 w-full border-b border-[#eeeeee] Me_Body-1 text-dg">
      <div className="w-[150px]">
        <Chip
          text={status}
          bgColor={statusColorMap[status].bgColor}
          textColor={statusColorMap[status].textColor}
          radius="rounded-sm"
        />
      </div>
      <p className="w-[250px]">{name}</p>
      <p className="flex-1">{products}</p>
      <p className="w-[150px]">{priority}</p>
    </div>
  );
};

export default FacilityTableItem;
