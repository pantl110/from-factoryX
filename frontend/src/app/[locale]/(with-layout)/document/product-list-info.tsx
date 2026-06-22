'use client';

import { useTranslations } from 'next-intl';
import ProductItem from '../quotation/product-item';
import PriceInfo from '@/ui/price-info';
import { QuotationProductDetailResponseModel } from '@/types/data-model';

interface ProductListInfoProps {
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
  taxAmount: number;
}

const ProductListInfo = ({
  productListInfoTitle,
  supplyAmount,
  taxAmount,
  productItems,
}: ProductListInfoProps) => {
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 items-center flex">
        {productListInfoTitle}
      </h3>

      <table>
        <thead>
          <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm">
            <th className="text-left px-3 flex-1">{tCommon('productName')}</th>
            <th className="text-left px-3 flex-1">{tCommon('productCode')}</th>
            <th className="text-left px-3 flex-1">
              {tCommon('specification')}
            </th>
            <th className="text-left px-3 flex-1">
              {tCommon('manufacturingQuantity')}
            </th>
            <th className="text-left px-3 flex-[0.8]">{tCommon('unit')}</th>
            <th className="text-left px-3 flex-1">{tCommon('unitPrice')}</th>
            <th className="text-left px-3 flex-1">{tCommon('amount')}</th>
          </tr>
        </thead>
        <tbody>
          {productItems.map((item, index) => (
            <ProductItem key={index} data={item} onlyRead={true} />
          ))}
        </tbody>
      </table>

      <PriceInfo
        supplyAmount={supplyAmount}
        taxAmount={taxAmount}
        textColor="text-blue"
      />
    </div>
  );
};

export default ProductListInfo;
