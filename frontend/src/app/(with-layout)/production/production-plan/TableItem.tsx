import Chip from "@/ui/chip";
import {
  OperationStatusType,
  operationStatusColorMap,
  StatusType,
  statusColorMap,
} from "@/types/status-type";

interface TableItemProps {
  operationStatus: OperationStatusType;
  materialStatus: StatusType;
}

const TableItem = ({ operationStatus, materialStatus }: TableItemProps) => {
  const { textColor, bgColor } = operationStatusColorMap[operationStatus];
  const materialColor = statusColorMap[materialStatus];
  return (
    <div className="flex items-center w-full h-12 border-b border-[#eeeeee] Me_Body-1 bg-white text-dg">
      <div className="w-[100px] py-1 px-3">
        <Chip text={operationStatus} textColor={textColor} bgColor={bgColor} />
      </div>
      <p className="flex-[2] py-1 px-3">플라스틱 컵</p>
      <p className="flex-1 py-1 px-3">P-001</p>
      <p className="flex-1 py-1 px-3">500ml</p>
      <p className="w-[80px] py-1 px-3">EA</p>
      <p className="flex-1 py-1 px-3">4000</p>
      <p className="flex-1 py-1 px-3">5200</p>
      <p className="flex-1 py-1 px-3">1호기</p>
      <div className="flex-1 py-1 px-3">
        <Chip
          text={materialStatus}
          textColor={materialColor.textColor}
          bgColor={materialColor.bgColor}
        />
      </div>
      <p className="flex-[1.1] py-1 px-3">-</p>
      <p className="flex-1 py-1 px-3">-</p>
      <p className="flex-1 py-1 px-3">김민수</p>
      <p className="flex-3 py-1 px-3">불량률이 너무 생긴다.</p>
    </div>
  );
};

export default TableItem;
