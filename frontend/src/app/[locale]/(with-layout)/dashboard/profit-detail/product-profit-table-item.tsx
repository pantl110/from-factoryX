'use client';

import { useState } from 'react';
import { ProductProfitModel } from '@/types/data-model';
import ProductDetail from '@/app/[locale]/(with-layout)/stock/product/product-detail';
import { formatMoney } from './utils';
import { NameShortcutCell, ProfitValueCells } from './profit-table-cells';

interface ProductProfitTableItemProps {
  row: ProductProfitModel;
}

const ProductProfitTableItem = ({ row }: ProductProfitTableItemProps) => {
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);

  return (
    <>
      <div className="h-14 flex items-center Me_Body-3 text-dg border-b border-lg cursor-default">
        <NameShortcutCell
          name={row.product_name}
          isEstimated={row.is_estimated}
          onShortcut={() => setIsProductDetailOpen(true)}
        />
        <p className="px-3 flex-1">{formatMoney(row.quantity)}</p>
        <ProfitValueCells {...row} />
      </div>

      {isProductDetailOpen && (
        <ProductDetail
          productId={row.product_id}
          onClose={() => setIsProductDetailOpen(false)}
        />
      )}
    </>
  );
};

export default ProductProfitTableItem;
