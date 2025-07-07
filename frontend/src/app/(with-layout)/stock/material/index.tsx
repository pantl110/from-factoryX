"use client";

import TableHeader from "./table-header";
import TableItem from "./table-item";
import { useDeleteMode } from "@/hooks/use-delete-mode";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import DeleteModal from "@/ui/modal/delete-modal";

interface MaterialProps {
  setIsMaterialDetailOpen: (v: boolean) => void;
}

const Material = ({ setIsMaterialDetailOpen }: MaterialProps) => {
  const {
    isDeleteMode,
    isDeleteModalOpen,
    toggleDeleteMode,
    closeDeleteModal,
  } = useDeleteMode();

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput />
        <MiniBtn
          text="삭제"
          textColor={isDeleteMode ? "text-red" : "text-dg"}
          borderColor={isDeleteMode ? "border-none" : "border-lg"}
          bgColor={isDeleteMode ? "bg-red-8" : "bg-wh"}
          hoverColor={isDeleteMode ? "hover:bg-red-hover" : "hover:bg-bg"}
          onClick={() => toggleDeleteMode([])}
        />
      </div>

      <div>
        <TableHeader isDeleteMode={isDeleteMode} />
        <TableItem
          materialName="알루미늄 시트"
          materialCode="RM-001"
          unit="EA"
          currentStock={5000}
          status="충분"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          isDeleteMode={isDeleteMode}
        />
        <TableItem
          materialName="투명 필름지"
          materialCode="RM-002"
          unit="m"
          currentStock={1200}
          status="부족"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          isDeleteMode={isDeleteMode}
        />
        <TableItem
          materialName="실리콘 고무 패킹"
          materialCode="RM-018"
          unit="EA"
          currentStock={3500}
          status="충분"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          isDeleteMode={isDeleteMode}
        />
        <TableItem
          materialName="절연 테이프"
          materialCode="RM-027"
          unit="롤"
          currentStock={80}
          status="부족"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          isDeleteMode={isDeleteMode}
        />
      </div>

      {isDeleteModalOpen && <DeleteModal onClose={closeDeleteModal} />}
    </>
  );
};

export default Material;
