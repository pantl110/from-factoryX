"use client";

import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import { useState } from "react";
import DeleteModal from "./modal/delete-modal";

interface SearchDeleteTableProps {
  isDeleteBtnClicked?: boolean;
  setIsDeleteBtnClicked?: (isDeleteBtnClicked: boolean) => void;
}

const SearchDeleteTable = ({
  isDeleteBtnClicked,
  setIsDeleteBtnClicked,
}: SearchDeleteTableProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  return (
    <div className="flex items-center justify-between pb-4">
      <SearchInput value="" onChange={() => {}} />
      <MiniBtn
        text="삭제"
        textColor={isDeleteBtnClicked ? "text-red" : "text-dg"}
        borderColor={isDeleteBtnClicked ? "" : "border-[#eeeeee]"}
        bgColor={isDeleteBtnClicked ? "bg-red-8" : "bg-white"}
        hoverColor={
          isDeleteBtnClicked ? "hover:bg-red-hover" : "hover:bg-gray-50"
        }
        onClick={() => {
          if (isDeleteBtnClicked) {
            setIsDeleteModalOpen(true);
          } else {
            setIsDeleteBtnClicked?.(true);
          }
        }}
      />

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => {
            setIsDeleteModalOpen(false);
            setIsDeleteBtnClicked?.(false);
          }}
        />
      )}
    </div>
  );
};

export default SearchDeleteTable;
