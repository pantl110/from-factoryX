'use client';

import { useTranslations } from 'next-intl';
import { ProductProfitModel } from '@/types/data-model';
import { ProfitValueHeaderCells } from './profit-table-cells';
import ProductProfitTableItem from './product-profit-table-item';

interface ProductProfitTableProps {
  rows: ProductProfitModel[];
}

const ProductProfitTable = ({ rows }: ProductProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <div>
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
        <p className="px-3 flex-1">{t('colProduct')}</p>
        <p className="px-3 flex-1">{t('colQuantity')}</p>
        <ProfitValueHeaderCells />
      </div>
      {rows.map((row) => (
        <ProductProfitTableItem key={row.product_name} row={row} />
      ))}
    </div>
  );
};

export default ProductProfitTable;
