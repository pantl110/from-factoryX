'use client';

import { useEffect, useState } from 'react';
import { usePagination } from '@/hooks';
import { normalizeForMatch } from '@/utils';
import { TABLE_PAGE_SIZE } from './utils';

const useSearchablePagination = <T>(
  rows: T[],
  searchable: boolean,
  getName: (row: T) => string
) => {
  const [search, setSearch] = useState('');
  const query = search.trim();

  const filtered =
    searchable && query
      ? rows.filter((row) =>
          normalizeForMatch(getName(row)).includes(normalizeForMatch(query))
        )
      : rows;

  const pagination = usePagination({
    items: filtered,
    itemsPerPage: TABLE_PAGE_SIZE,
  });
  const { setCurrentPage } = pagination;

  useEffect(() => {
    setCurrentPage(1);
  }, [query, rows.length, setCurrentPage]);

  return { search, setSearch, filteredCount: filtered.length, ...pagination };
};

export default useSearchablePagination;
