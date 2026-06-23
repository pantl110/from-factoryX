'use client';

import { useTranslations } from 'next-intl';
import { ClientProfitModel } from '@/types/data-model';
import Pagination from '@/components/pagination';
import { ProfitValueHeaderCells } from './profit-table-cells';
import ClientProfitTableItem from './client-profit-table-item';
import SearchableTableShell from './searchable-table-shell';
import useSearchablePagination from './use-searchable-pagination';

interface ClientProfitTableProps {
  rows: ClientProfitModel[];
  onSelect?: (client: ClientProfitModel) => void;
  searchable?: boolean;
  title?: string;
}

const ClientProfitTable = ({
  rows,
  onSelect,
  searchable = false,
  title,
}: ClientProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const {
    search,
    setSearch,
    filteredCount,
    currentItems,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useSearchablePagination(rows, searchable, (row) => row.client_name);

  return (
    <SearchableTableShell
      searchable={searchable}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('searchClientPlaceholder')}
      isEmpty={filteredCount === 0}
      emptyText={search.trim() ? t('noClientResult') : t('noClientData')}
      title={title}
    >
      <div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
          <p className="px-3 flex-1">{t('colClient')}</p>
          <ProfitValueHeaderCells />
        </div>
        {currentItems.map((row) => (
          <ClientProfitTableItem
            key={row.client_id}
            client={row}
            onSelect={onSelect}
          />
        ))}
        {totalPages > 1 && (
          <div className="flex justify-center mt-3">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </SearchableTableShell>
  );
};

export default ClientProfitTable;
