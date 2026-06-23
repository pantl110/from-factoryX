'use client';

import { useTranslations } from 'next-intl';
import { ProductProfitModel } from '@/types/data-model';
import { usePagination } from '@/hooks';
import Pagination from '@/components/pagination';
import { ProfitValueHeaderCells } from './profit-table-cells';
import { TABLE_PAGE_SIZE } from './utils';
import ProductProfitTableItem from './product-profit-table-item';

interface ProductProfitTableProps {
  rows: ProductProfitModel[];
}

const ProductProfitTable = ({ rows }: ProductProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const { currentItems, currentPage, totalPages, setCurrentPage } =
    usePagination({ items: rows, itemsPerPage: TABLE_PAGE_SIZE });

  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
        <p className="px-3 flex-1">{t('colProduct')}</p>
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
  );
};

export default ProductProfitTable;
