"use client";

import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";

const SearchDeleteTable = () => {
  return (
    <div className="flex items-center justify-between pb-4">
      <SearchInput />
      <MiniBtn
        text="삭제"
        textColor="text-dg"
        borderColor="border-[#eeeeee]"
        icon={TrashIcon}
        iconColor="text-sv"
      />
    </div>
  );
};

export default SearchDeleteTable;
