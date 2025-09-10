'use client';

import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import { useState, useEffect } from 'react';
import useMemberStore from '@/store/member-store';

interface SearchDeleteTableProps {
  placeholder?: string;
  checkedCount: number;
  deleteButtonText: string;
  onDelete: () => void;
  onCancel: () => void;
  onSearch?: (query: string) => void;
  searchKeyword?: string;
  hasData?: boolean;
  hasDeleteButton?: boolean;
}

const SearchDeleteTable = ({
  placeholder,
  checkedCount,
  deleteButtonText,
  onDelete,
  onCancel,
  onSearch,
  searchKeyword = '',
  hasData,
  hasDeleteButton = true,
}: SearchDeleteTableProps) => {
  const role = useMemberStore((state) => state.role);
  const [searchValue, setSearchValue] = useState(searchKeyword);

  // 외부에서 searchKeyword가 변경되면 내부 state 동기화
  useEffect(() => {
    setSearchValue(searchKeyword);
  }, [searchKeyword]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onSearch?.(value);
  };

  return (
    <div className="flex items-center justify-between pb-4">
      <SearchInput
        value={searchValue}
        onChange={handleSearchChange}
        placeholder={placeholder}
      />
      {hasData && hasDeleteButton && (
        <div className="flex gap-1">
          <MiniBtn
            text="취소"
            textColor="text-dg"
            borderColor="border-lg"
            bgColor="bg-white"
            hoverColor="hover:bg-bg"
            onClick={onCancel}
            disabled={role === 'viewer'}
          />
          <MiniBtn
            text={deleteButtonText}
            textColor={checkedCount > 0 ? 'text-red' : 'text-dg'}
            borderColor={checkedCount > 0 ? '' : 'border-lg'}
            bgColor={checkedCount > 0 ? 'bg-red-8' : 'bg-white'}
            hoverColor={checkedCount > 0 ? 'hover:bg-red-hover' : 'hover:bg-bg'}
            onClick={checkedCount > 0 ? onDelete : () => {}}
            disabled={role === 'viewer'}
          />
        </div>
      )}
    </div>
  );
};

export default SearchDeleteTable;
