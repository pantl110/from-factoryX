import { ProductHistoryResponseModel } from '@/types/data-model';
import ProductStockLogItem from './product-stock-log-item';
import Pagination from '@/components/pagination';
import { useTranslations } from 'next-intl';

interface ProductStockLogProps {
  data: ProductHistoryResponseModel[];
  page: number;
  totalPages: number;
  setPage: (page: number) => void;
  setIsProjectStockHistoryModalOpen: (modal: {
    isOpen: boolean;
    projectId?: number;
  }) => void;
}

const ProductStockLog = ({
  data,
  page,
  totalPages,
  setPage,
  setIsProjectStockHistoryModalOpen,
}: ProductStockLogProps) => {
  const t = useTranslations('stock.product.productHistory');
  const tStock = useTranslations('stock');
  const tCommon = useTranslations('common');

  if (data.length === 0) return null;
  return (
    <>
      <div className="cursor-default">
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
          <p className="flex-1 py-1 px-3 text-sv">
            {t('tableHeader.processDate')}
          </p>
          <p className="flex-1 py-1 px-3 text-sv">{tCommon('clientName')}</p>
          <p className="flex-1 py-1 px-3 text-sv">
            {tStock('productionQuantity')}
          </p>
          <p className="flex-1 py-1 px-3 text-sv">
            {tStock('deliveryQuantity')}
          </p>
          <p className="flex-1 py-1 px-3 text-sv">{tCommon('currentStock')}</p>
          <p className="flex-1 py-1 px-3 text-sv">
            {t('tableHeader.movementLog')}
          </p>
        </div>
        {data.map((item) => (
          <ProductStockLogItem
            key={item.id}
            item={item}
            setIsProjectStockHistoryModalOpen={
              setIsProjectStockHistoryModalOpen
            }
          />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </>
  );
};

export default ProductStockLog;
