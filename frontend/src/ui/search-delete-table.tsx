"use client";

import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import DeleteModal from "./modal/delete-modal";
import { useDeleteMode } from "@/hooks/use-delete-mode";

interface SearchDeleteTableProps {
  checkedIds?: (string | number)[];
  isDeleteMode: boolean;
  toggleDeleteMode: (selectedIds: (string | number)[]) => void;
}

const SearchDeleteTable = ({
  checkedIds = [],
  isDeleteMode,
  toggleDeleteMode,
}: SearchDeleteTableProps) => {
  return (
    <div className="flex items-center justify-between pb-4">
      <SearchInput value="" onChange={() => {}} />
      <MiniBtn
        text="삭제"
        textColor={
          isDeleteMode && checkedIds.length > 0 ? "text-red" : "text-dg"
        }
        borderColor={
          isDeleteMode && checkedIds.length > 0 ? "" : "border-[#eeeeee]"
        }
        bgColor={
          isDeleteMode && checkedIds.length > 0 ? "bg-red-8" : "bg-white"
        }
        hoverColor={
          isDeleteMode && checkedIds.length > 0
            ? "hover:bg-red-hover"
            : "hover:bg-gray-50"
        }
        onClick={() => toggleDeleteMode(checkedIds)}
      />
    </div>
  );
};

export default SearchDeleteTable;
