import { ProductDataModel } from "@/types/data-model";

interface ProductItemProps extends ProductDataModel {
  onClick?: () => void;
}

const ProductItem = ({
  productName,
  productCode,
  size,
  unit,
  quantity,
  unitPrice,
  totalPrice,
  onClick,
}: ProductItemProps) => {
  return (
    <div
      className="h-14 flex items-center Me_Body-1 text-dg border-b border-[#eeeeee] cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      <p className="flex-1 px-3 truncate" title={productName}>
        {productName}
      </p>
      <p className="flex-1 px-3">{productCode}</p>
      <p className="flex-1 px-3">{size}</p>
      <p className="w-[80px] px-3">{unit}</p>
      <p className="flex-1 px-3">{quantity?.toLocaleString()}</p>
      <p className="w-[100px] px-3">{unitPrice?.toLocaleString()}</p>
      <p className="flex-1 px-3">{totalPrice?.toLocaleString()}</p>
    </div>
  );
};

export default ProductItem;
