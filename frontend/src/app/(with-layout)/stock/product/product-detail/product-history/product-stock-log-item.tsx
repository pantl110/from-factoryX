import { ProductHistoryResponseModel } from '@/types/data-model';
import IconBtn from '@/ui/icon-btn';
import { Note } from '@phosphor-icons/react';

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
    created_at,
    client_name,
    production_quantity,
    delivery_quantity,
    total_stock,
    project_id,
  } = item;

  return (
    <>
      <div className="flex items-center h-14 border-b border-lg Me_Body-1">
        <p className="flex-1 px-3 text-dg">{created_at.split('T')[0]}</p>
        <p className="flex-1 px-3 text-dg">{client_name}</p>
        <p className="flex-1 px-3 text-primary">
          {production_quantity
            ? '+' + production_quantity.toLocaleString()
            : '-'}
        </p>
        <p className="flex-1 px-3 text-red">
          {delivery_quantity ? '-' + delivery_quantity.toLocaleString() : '-'}
        </p>
        <p className="flex-1 px-3 text-dg">
          {total_stock ? total_stock.toLocaleString() : '-'}
        </p>
        <div className="flex-1 px-3 text-dg">
          <IconBtn
            icon={Note}
            onClick={() => {
              setIsProjectStockHistoryModalOpen({
                isOpen: true,
                projectId: project_id,
              });
            }}
          />
        </div>
      </div>
    </>
  );
};

export default ProductStockLogItem;
