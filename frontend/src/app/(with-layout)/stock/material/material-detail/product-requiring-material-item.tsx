import { ArrowLineUpRight, X } from '@phosphor-icons/react';

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
  const handleDeleteClick = () => {
    handleOpenDeleteModal(connectionId);
  };

  const handleProductClick = () => {
    // 추가
    onProductClick(productId);
  };

  return (
    <div className="flex items-center h-14 border-b border-lg hover:border hover:border-primary Me_Body-1 group">
      <div
        className="flex-1 px-3 flex items-center gap-1 min-w-0"
        title={productName}
      >
        <p className="text-dg truncate">{productName}</p>
        <button
          className="w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-bg transition-colors duration-200 group-hover:opacity-100 opacity-0"
          onClick={handleProductClick}
        >
          <ArrowLineUpRight size={16} className="text-dg" />
        </button>
      </div>

      <p className="flex-1 px-3 text-dg">{productCode}</p>
      <p className="flex-1 px-3 text-dg">{size}</p>
      <p className="w-[80px] px-3 text-dg">{unit}</p>
      <button
        className="w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 ease-in-out rounded-[8px] hover:bg-bg"
        onClick={handleDeleteClick}
      >
        <X size={16} className="text-dg" />
      </button>
    </div>
  );
};

export default ProductRequiringMaterialItem;
