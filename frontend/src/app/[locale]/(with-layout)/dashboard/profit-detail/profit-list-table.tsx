'use client';

import { ReactNode } from 'react';
import { ProfitListScopeType } from '@/types/data-model';
import { ProfitSortConfigModel, ProfitSortKeyType } from './profit-table-cells';
import SearchableTableShell from './searchable-table-shell';
import SectionLoading from './section-loading';
import TablePagination from './table-pagination';
import useProfitList from './use-profit-list';

interface ProfitListTableProps<T> {
  scope: ProfitListScopeType;
  from: string;
  to: string;
  parentId?: string;
  defaultSort: ProfitSortKeyType;
  searchable?: boolean;
  title?: string;
  searchPlaceholder: string;
  noResultText: string;
  noDataText: string;
  renderHeader: (sort: ProfitSortConfigModel) => ReactNode;
  renderRows: (rows: T[]) => ReactNode;
}

const ProfitListTable = <T,>({
  scope,
  from,
  to,
  parentId,
  defaultSort,
  searchable = false,
  title,
  searchPlaceholder,
  noResultText,
  noDataText,
  renderHeader,
  renderRows,
}: ProfitListTableProps<T>) => {
  const {
    rows,
    totalPages,
    page,
    setPage,
    isLoading,
    search,
    onSearchChange,
    sort,
  } = useProfitList<T>({ scope, from, to, parentId, defaultSort });

  return (
    <SearchableTableShell
      searchable={searchable}
      search={search}
      onSearchChange={onSearchChange}
      searchPlaceholder={searchPlaceholder}
      isEmpty={!isLoading && rows.length === 0}
      emptyText={search.trim() ? noResultText : noDataText}
      title={title}
    >
      {isLoading ? (
        <SectionLoading height="h-[200px]" />
      ) : (
        <div>
          <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm">
            {renderHeader(sort)}
          </div>
          {renderRows(rows)}
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </SearchableTableShell>
  );
};

export default ProfitListTable;
