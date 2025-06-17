import Chip from "@/ui/chip";
import {
  StatusType,
  statusColorMap,
  OperationStatusType,
  operationStatusColorMap,
} from "@/types/status-type";

const PendingTableItem = () => {
  const status: StatusType = "충분";
  const { textColor, bgColor } = statusColorMap[status];

  const operationStatus: OperationStatusType = "가동 대기";
  const { textColor: operationTextColor, bgColor: operationBgColor } =
    operationStatusColorMap[operationStatus];

  return (
    <div className="flex items-center w-full h-16 border-b border-[#eeeeee] Me_Body-1 rounded text-dg">
      <div className="w-[100px] py-1 px-3">
        <Chip
          text={operationStatus}
          textColor={operationTextColor}
          bgColor={operationBgColor}
        />
      </div>
      <p className="flex-[2] py-1 px-3">플라스틱 컵</p>
      <p className="flex-1 py-1 px-3">P-001</p>
      <p className="flex-1 py-1 px-3">500ml</p>
      <p className="w-[80px] py-1 px-3">EA</p>
      <p className="flex-1 py-1 px-3">4000</p>
      <p className="flex-1 py-1 px-3">5200</p>
      <p className="flex-1 py-1 px-3">1호기</p>
      <div className="flex-1 py-1 px-3">
        <Chip text={status} textColor={textColor} bgColor={bgColor} />
      </div>
      <p className="flex-[1.1] py-1 px-3">-</p>
      <p className="flex-1 py-1 px-3">-</p>
      <p className="flex-1 py-1 px-3">김민수</p>
      <p className="flex-3 py-1 px-3">불량률이 너무 생긴다.</p>
    </div>
  );
};

export default PendingTableItem;
