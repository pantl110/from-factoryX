import { QuotationProductResponseModel } from '@/types/data-model';
import { X } from '@phosphor-icons/react';

interface ProductItemProps {
  data: QuotationProductResponseModel & {
    productName: string;
    productCode: string;
    size: string;
    unit: string;
  };
  onClick?: () => void;
  transaction?: boolean;
}

const ProductItem = ({
  data,
  onClick,
  transaction = false,
}: ProductItemProps) => {
  const {
    productName,
    productCode,
    size,
    unit,
    quantity,
    unit_price: unitPrice,
  } = data;

  return (
    <tr
      className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg"
      onClick={onClick}
    >
      <td className="flex-1 px-3 truncate" title={productName}>
        <input type="text" value={productName} className="w-full" readOnly />
      </td>
      <td className="flex-1 px-3">
        <input type="text" value={productCode} className="w-full" readOnly />
      </td>
      <td className="flex-1 px-3">
        <input type="text" value={size} className="w-full" readOnly />
      </td>
      <td className="w-[80px] px-3">
        <input type="text" value={unit} className="w-full" readOnly />
      </td>
      <td className="flex-1 px-3">
        <input
          type="text"
          value={(quantity * unitPrice)?.toLocaleString()}
          className="w-full"
          readOnly
        />
      </td>
      {!transaction && (
        <td className="w-8 h-full flex justify-center items-center cursor-pointer">
          <X size={16} className="text-sv" />
        </td>
      )}
    </tr>
  );
};

export default ProductItem;
