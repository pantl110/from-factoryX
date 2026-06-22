'use client';

import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import { useState, useEffect } from 'react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

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
  disableForProdManager?: boolean; // 세금계산서 페이지에서만 생산관리자 제한 적용
}

const SearchDeleteTable = ({
  placeholder,
  checkedCount,
  deleteButtonText,
  onDelete,
  // onCancel,
  onSearch,
  searchKeyword = '',
  hasData,
  hasDeleteButton = true,
  disableForProdManager = false,
}: SearchDeleteTableProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

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
      {hasData &&
        hasDeleteButton &&
        !isViewer &&
        (!disableForProdManager || role !== 'prod_manager') &&
        hasSubscription() && (
          <div className="flex gap-1">
            {/* <MiniBtn variant="whiteOutline"
            text="취소"
            onClick={onCancel}
          /> */}
            <MiniBtn
              text={deleteButtonText}
              variant={checkedCount > 0 ? 'red' : 'whiteOutline'}
              onClick={checkedCount > 0 ? onDelete : () => {}}
            />
          </div>
        )}
    </div>
  );
};

export default SearchDeleteTable;
