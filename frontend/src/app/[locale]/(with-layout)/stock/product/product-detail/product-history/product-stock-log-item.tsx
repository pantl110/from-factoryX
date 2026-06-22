import { ProductHistoryResponseModel } from '@/types/data-model';
import IconBtn from '@/ui/icon-btn';
import { Note } from '@phosphor-icons/react';
import { formatISODate } from '@/utils';

interface ProductStockLogItemProps {
  item: ProductHistoryResponseModel;
  setIsProjectStockHistoryModalOpen: (modal: {
    isOpen: boolean;
    projectId?: number;
  }) => void;
}

const ProductStockLogItem = ({
  item,
  setIsProjectStockHistoryModalOpen,
}: ProductStockLogItemProps) => {
  const {
    created_at: createdAt,
    client_name: clientName,
    production_quantity: productionQuantity,
    delivery_quantity: deliveryQuantity,
    total_stock: totalStock,
    project_id: projectId,
    has_more_history: hasMoreHistory,
  } = item;

  return (
    <>
      <div className="flex items-center h-14 border-b border-lg Me_Body-3">
        <p className="flex-1 px-3 text-dg">{formatISODate(createdAt)}</p>
        <p className="flex-1 px-3 text-dg">{clientName}</p>
        <p className="flex-1 px-3 text-blue">
          {productionQuantity ? '+' + productionQuantity.toLocaleString() : '-'}
        </p>
        <p className="flex-1 px-3 text-red">
          {deliveryQuantity ? '-' + deliveryQuantity.toLocaleString() : '-'}
        </p>
        <p className="flex-1 px-3 text-dg">
          {totalStock ? totalStock.toLocaleString() : '-'}
        </p>
        <div className="flex-1 px-3 text-dg">
          {hasMoreHistory ? (
            <IconBtn
              icon={Note}
              onClick={() => {
                setIsProjectStockHistoryModalOpen({
                  isOpen: true,
                  projectId,
                });
              }}
            />
          ) : (
            '-'
          )}
        </div>
      </div>
    </>
  );
};

export default ProductStockLogItem;
