'use client';

import { useTranslations } from 'next-intl';
import { ProductProfitModel, ProfitListScopeType } from '@/types/data-model';
import {
  ProfitValueHeaderCells,
  SortableHeaderCell,
} from './profit-table-cells';
import ProductProfitTableItem from './product-profit-table-item';
import ProfitListTable from './profit-list-table';

interface ProductProfitTableProps {
  scope: ProfitListScopeType;
  from: string;
  to: string;
  parentId?: string;
  searchable?: boolean;
  title?: string;
}

const ProductProfitTable = ({
  scope,
  from,
  to,
  parentId,
  searchable,
  title,
}: ProductProfitTableProps) => {
  const t = useTranslations('dashboard.profitDetail');

  return (
    <ProfitListTable<ProductProfitModel>
      scope={scope}
      from={from}
      to={to}
      parentId={parentId}
      defaultSort="profit"
      searchable={searchable}
      title={title}
      searchPlaceholder={t('searchProductPlaceholder')}
      noResultText={t('noProductResult')}
      noDataText={t('noProductData')}
      renderHeader={(sort) => (
        <>
          <SortableHeaderCell
            label={t('colProduct')}
            columnKey="product_name"
            widthClass="flex-[2]"
            sort={sort}
          />
          <p className="px-3 w-[90px]">{t('colQuantity')}</p>
          <ProfitValueHeaderCells sort={sort} />
        </>
      )}
      renderRows={(rows) =>
        rows.map((row) => (
          <ProductProfitTableItem key={row.product_name} row={row} />
        ))
      }
    />
  );
};

export default ProductProfitTable;
