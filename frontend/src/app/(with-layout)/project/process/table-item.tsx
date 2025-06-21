"use client";

import Chip from "@/ui/chip";
import { useRouter } from "next/navigation";
import {
  ProjectStatusType,
  ProjectStatusColorMap,
  TransactionStatusType,
  TaxStatusType,
  TransactionStatusColorMap,
  TaxStatusColorMap,
} from "@/types/status-type";

interface TableItemProps {
  id: number;
  status: ProjectStatusType;
  companyName: string;
  items: string;
  startDate: string;
  endDate: string;
  transactionIssued: TransactionStatusType;
  taxIssued: TaxStatusType;
}

const TableItem = ({
  id,
  status,
  companyName,
  items,
  startDate,
  endDate,
  transactionIssued,
  taxIssued,
}: TableItemProps) => {
  const router = useRouter();
  const chipColors = ProjectStatusColorMap[status];
  const transactionColor = TransactionStatusColorMap[transactionIssued];
  const taxColor = TaxStatusColorMap[taxIssued];

  const handleClick = () => {
    if (status === "견적 협의") return;
    router.push(`/production/${id}`);
  };

  return (
    <div
      className="flex items-center h-14 w-[1448px] border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-gray-50"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
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
      <p className="flex-2 py-1 px-3 text-dg">{companyName}</p>
      <p className="flex-2 py-1 px-3 text-dg">{items}</p>
      <p className="w-[200px] py-1 px-3 text-dg">{startDate}</p>
      <p className="w-[200px] py-1 px-3 text-dg">{endDate}</p>
      <p className={`w-[200px] py-1 px-3 ${transactionColor}`}>
        {transactionIssued}
      </p>
      <p className={`w-[200px] py-1 px-3 ${taxColor}`}>{taxIssued}</p>
    </div>
  );
};

export default TableItem;
