'use client';

import { useEffect, useState } from 'react';
import { ProfitListScopeType } from '@/types/data-model';
import useGetProfit from '@/hooks/dashboard/use-get-profit';
import { ProfitSortKeyType } from './profit-table-cells';
import { TABLE_PAGE_SIZE } from './utils';

interface UseProfitListParamsModel {
  scope: ProfitListScopeType;
  from: string;
  to: string;
  parentId?: string;
  defaultSort: ProfitSortKeyType;
}

const useProfitList = <T>({
  scope,
  from,
  to,
  parentId,
  defaultSort,
}: UseProfitListParamsModel) => {
  const { getProfitList } = useGetProfit();
  const [rows, setRows] = useState<T[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<ProfitSortKeyType>(defaultSort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPage(1);
  }, [from, to, parentId]);

  useEffect(() => {
    setIsLoading(true);
    getProfitList<T>({
      scope,
      from,
      to,
      parentId,
      page,
      pageSize: TABLE_PAGE_SIZE,
      sort: sortKey,
      order: sortOrder,
      search: search.trim() || undefined,
    }).then((result) => {
      if (result.success && result.data) {
        setRows(result.data.data);
        setTotal(result.data.total);
      } else {
        setRows([]);
        setTotal(0);
      }
      setIsLoading(false);
    });
  }, [
    getProfitList,
    scope,
    from,
    to,
    parentId,
    page,
    sortKey,
    sortOrder,
    search,
  ]);

  const handleSort = (key: ProfitSortKeyType) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setPage(1);
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return {
    rows,
    total,
    totalPages: Math.ceil(total / TABLE_PAGE_SIZE),
    isLoading,
    page,
    setPage,
    search,
    onSearchChange,
    sort: { sortKey, sortOrder, onSort: handleSort },
  };
};

export default useProfitList;
