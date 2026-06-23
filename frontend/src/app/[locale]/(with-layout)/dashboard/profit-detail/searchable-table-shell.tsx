'use client';

import { ReactNode } from 'react';
import SearchInput from '@/ui/search-input';
import NoHistoryBox from '@/ui/no-history-box';

interface SearchableTableShellProps {
  searchable: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  isEmpty: boolean;
  emptyText: string;
  title?: string;
  children: ReactNode;
}

const SearchableTableShell = ({
  searchable,
  search,
  onSearchChange,
  searchPlaceholder,
  isEmpty,
  emptyText,
  title,
  children,
}: SearchableTableShellProps) => (
  <div className="flex flex-col gap-3">
    {(title || searchable) && (
      <div className="flex items-center justify-between">
        {title ? <h3 className="Heading-3">{title}</h3> : <div />}
        {searchable && (
          <SearchInput
            width="w-[320px]"
            value={search}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
          />
        )}
      </div>
    )}
    {isEmpty ? <NoHistoryBox text={emptyText} /> : children}
  </div>
);

export default SearchableTableShell;
