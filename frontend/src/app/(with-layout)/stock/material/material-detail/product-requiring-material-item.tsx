import { ArrowLineUpRight, X } from '@phosphor-icons/react';
import IconBtn from '@/ui/icon-btn';
import useMemberStore from '@/store/member-store';

interface ProductRequiringMaterialItemProps {
  productName: string;
  productCode: string;
  size: string;
  unit: string;
  connectionId: number;
  handleOpenDeleteModal: (connectionId: number) => void;
  onProductClick: (productId: number) => void; // 추가
  productId: number; // 추가
}

const ProductRequiringMaterialItem = ({
  productName,
  productCode,
  size,
  unit,
  connectionId,
  handleOpenDeleteModal,
  onProductClick, // 추가
  productId, // 추가
}: ProductRequiringMaterialItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const handleDeleteClick = () => {
    handleOpenDeleteModal(connectionId);
  };

  const handleProductClick = () => {
    // 추가
    onProductClick(productId);
  };

  return (
    <div className="flex items-center h-14 border-b border-lg hover:border hover:border-primary Me_Body-1 group cursor-default">
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
          groupHover={true}
        />
      </div>

      <p className="flex-1 px-3 text-dg">{productCode}</p>
      <p className="flex-1 px-3 text-dg">{size}</p>
      <p className="flex-1 px-3 text-dg">{unit}</p>

      {!isViewer && (
        <IconBtn
          icon={X}
          size="w-9 h-9"
          iconSize={16}
          onClick={handleDeleteClick}
          groupHover={true}
        />
      )}
    </div>
  );
};

export default ProductRequiringMaterialItem;
