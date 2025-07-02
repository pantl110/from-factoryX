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
    <tr
      className="h-14 flex items-center Me_Body-1 text-dg border-b border-[#eeeeee] cursor-pointer hover:bg-bg transition-colors duration-200"
      onClick={onClick}
    >
      <td className="flex-1 px-3 truncate" title={productName}>
        {productName}
      </td>
      <td className="flex-1 px-3">{productCode}</td>
      <td className="flex-1 px-3">{size}</td>
      <td className="w-[80px] px-3">{unit}</td>
      <td className="flex-1 px-3">{quantity?.toLocaleString()}</td>
      <td className="w-[100px] px-3">{unitPrice?.toLocaleString()}</td>
      <td className="flex-1 px-3">{totalPrice?.toLocaleString()}</td>
    </tr>
  );
};

export default ProductItem;
