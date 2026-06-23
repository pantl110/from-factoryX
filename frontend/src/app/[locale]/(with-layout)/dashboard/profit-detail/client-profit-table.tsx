'use client';

import { useTranslations } from 'next-intl';
import { ClientProfitModel } from '@/types/data-model';
import { usePagination } from '@/hooks';
import Pagination from '@/components/pagination';
import { ProfitValueHeaderCells } from './profit-table-cells';
import { TABLE_PAGE_SIZE } from './utils';
import ClientProfitTableItem from './client-profit-table-item';

interface ClientProfitTableProps {
  rows: ClientProfitModel[];
  onSelect: (client: ClientProfitModel) => void;
}

const ClientProfitTable = ({ rows, onSelect }: ClientProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({ items: rows, itemsPerPage: TABLE_PAGE_SIZE });

  return (
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
  );
};

export default ClientProfitTable;
