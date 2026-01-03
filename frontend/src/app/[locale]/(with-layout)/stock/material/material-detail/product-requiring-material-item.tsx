import { ArrowLineUpRight, Trash } from '@phosphor-icons/react';
import IconBtn from '@/ui/icon-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface ProductRequiringMaterialItemProps {
  productName: string;
  productCode: string;
  size: string;
  unit: string;
  connectionId: number;
  handleOpenDeleteModal: (connectionId: number) => void;
  onProductClick: (productId: number) => void;
  productId: number;
}

const ProductRequiringMaterialItem = ({
  productName,
  productCode,
  size,
  unit,
  connectionId,
  handleOpenDeleteModal,
  onProductClick,
  productId,
}: ProductRequiringMaterialItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const handleDeleteClick = () => {
    handleOpenDeleteModal(connectionId);
  };

  const handleProductClick = () => {
    onProductClick(productId);
  };

  return (
    <div className="flex items-center h-14 border-b border-lg Me_Body-1 cursor-default">
      <div
        className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
        title={productName}
      >
        <p className="text-dg truncate">{productName}</p>
        <IconBtn
          icon={ArrowLineUpRight}
          size="w-9 h-9"
          iconSize={16}
          onClick={handleProductClick}
        />
      </div>

      <p className="flex-1 px-3 text-dg">{productCode}</p>
      <p className="flex-1 px-3 text-dg">{size}</p>
      <p className="flex-1 px-3 text-dg">{unit}</p>

      {!isViewer && hasSubscription() && (
        <div className="w-20 px-3">
          <IconBtn
            icon={Trash}
            size="w-9 h-9"
            iconSize={16}
            onClick={handleDeleteClick}
            hoverBg={false}
            hoverText={true}
          />
        </div>
      )}
    </div>
  );
};

export default ProductRequiringMaterialItem;
