import Chip from "@/ui/chip";
import { StatusType, statusColorMap } from "./types";

const CompletedTableItem = () => {
  const status: StatusType = "충분";
  const { textColor, bgColor } = statusColorMap[status];

  return (
    <div className="flex items-center w-full h-14 border-b border-[#eeeeee] Me_Body-1 text-dg">
      <p className="flex-1 py-1 px-3">P-001</p>
      <p className="flex-[2] py-1 px-3">플라스틱 컵</p>
      <p className="flex-1 py-1 px-3">500ml</p>
      <p className="w-[80px] py-1 px-3">EA</p>
      <p className="flex-1 py-1 px-3">5,000</p>
      <p className="flex-1 py-1 px-3">5,025</p>
      <p className="flex-1 py-1 px-3">1호기</p>
      <p className="flex-1 py-1 px-3">69초</p>
      <div className="flex-1 py-1 px-3">
        <Chip text={status} textColor={textColor} bgColor={bgColor} />
      </div>
      <p className="flex-1 py-1 px-3">김민수</p>
    </div>
  );
};

export default CompletedTableItem;
