'use client';

import { useTranslations } from 'next-intl';
import { ProductProfitModel } from '@/types/data-model';
import Pagination from '@/components/pagination';
import { ProfitValueHeaderCells } from './profit-table-cells';
import ProductProfitTableItem from './product-profit-table-item';
import SearchableTableShell from './searchable-table-shell';
import useSearchablePagination from './use-searchable-pagination';

interface ProductProfitTableProps {
  rows: ProductProfitModel[];
  searchable?: boolean;
  title?: string;
}

const ProductProfitTable = ({
  rows,
  searchable = false,
  title,
}: ProductProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const {
    search,
    setSearch,
    filteredCount,
    currentItems,
    currentPage,
    totalPages,
    setCurrentPage,
  } = useSearchablePagination(rows, searchable, (row) => row.product_name);

  return (
    <SearchableTableShell
      searchable={searchable}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t('searchProductPlaceholder')}
      isEmpty={filteredCount === 0}
      emptyText={search.trim() ? t('noProductResult') : t('noProductData')}
      title={title}
    >
      <div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
          <p className="px-3 flex-[2]">{t('colProduct')}</p>
          <p className="px-3 w-[90px]">{t('colQuantity')}</p>
          <ProfitValueHeaderCells />
        </div>
        {currentItems.map((row) => (
          <ProductProfitTableItem key={row.product_name} row={row} />
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

export default ProductProfitTable;
