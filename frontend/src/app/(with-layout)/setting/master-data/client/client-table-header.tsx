import Checkbox from "@/ui/checkbox";
import React from "react";

interface ClientTableHeaderProps {
  isAllChecked?: boolean;
  onToggleAll?: () => void;
}

const ClientTableHeader = ({
  isAllChecked,
  onToggleAll,
}: ClientTableHeaderProps) => {
  return (
    <div className="flex h-12 w-[1697px] items-center border-t border-b border-[#eeeeee] Me_Body-1 text-sv">
      <Checkbox
        isChecked={isAllChecked || false}
        onToggle={onToggleAll || (() => {})}
      />
      <div className="w-[150px] px-3 flex gap-1 items-center">
        <p className=" text-sv">거래처</p>
        {/* <CaretDown size={16} className="text-sv" /> */}
      </div>
      <p className="px-3 flex-1">회사명</p>
      <p className="px-3 flex-1">사업자등록번호</p>
      <p className="px-3 w-[100px]">대표자명</p>
      <p className="px-3 w-[200px]">업태</p>
      <p className="px-3 flex-1">종목</p>
      <p className="px-3 w-[150px]">연락처</p>
      <p className="px-3 flex-1">이메일</p>
    </div>
  );
};

export default ClientTableHeader;
