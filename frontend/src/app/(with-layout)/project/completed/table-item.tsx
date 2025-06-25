"use client";

import Chip from "@/ui/chip";
import { useRouter } from "next/navigation";
import {
  CompletedProjectStatusType,
  CompletedProjectStatusColorMap,
} from "@/types/status-type";

interface TableItemProps {
  id: number;
  status: CompletedProjectStatusType;
  companyName: string;
  productName: string;
  date: string;
  isDeleteMode?: boolean;
}

const TableItem = ({
  id,
  status,
  companyName,
  productName,
  date,
  isDeleteMode = false,
}: TableItemProps) => {
  const router = useRouter();
  const chipColors = CompletedProjectStatusColorMap[status];
  const handleClick = () => {
    if (status === "중단") return;
    router.push(`/production/${id}`);
  };

  return (
    <div
      className="flex items-center h-14 w-full min-w-[1146px] border-b border-[#eeeeee] Me_Body-1 cursor-pointer hover:bg-gray-50"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      <div
        className="flex items-center py-3 px-2"
        role="button"
        tabIndex={0}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") e.stopPropagation();
        }}
      >
        {isDeleteMode && (
          <input type="checkbox" className="w-4 h-4 border-sv" />
        )}
      </div>
      <div className="py-1 px-3 w-[150px]">
        <Chip
          text={status}
          bgColor={chipColors.bgColor}
          textColor={chipColors.textColor}
        />
      </div>
      <p className="flex-1 py-1 px-3 text-dg">{companyName}</p>
      <p className="flex-1 py-1 px-3 text-dg">{productName}</p>
      <p className="w-[200px] py-1 px-3 text-dg">{date}</p>
    </div>
  );
};

export default TableItem;
