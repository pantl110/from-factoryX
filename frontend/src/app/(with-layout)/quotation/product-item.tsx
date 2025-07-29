import { QuotationProductDetailResponseModel } from '@/types/data-model';
import { X } from '@phosphor-icons/react';

interface ProductItemProps {
  data?: QuotationProductDetailResponseModel;
  onClick?: () => void;
  canDelete?: boolean;
  onChange?: (field: 'quantity' | 'unit_price', value: string) => void;
  onDelete?: () => void;
}

const ProductItem = ({
  data,
  onClick,
  canDelete = false,
  onChange,
  onDelete,
}: ProductItemProps) => {
  return (
    <tr
      className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg"
      onClick={onClick}
    >
      <td className="flex-1 px-3 truncate" title={data?.product_name}>
        <p className="w-full">{data?.product_name || '-'}</p>
      </td>
      <td className="flex-1 px-3">
        <p className="w-full">{data?.product_code || '-'}</p>
      </td>
      <td className="flex-1 px-3">
        <p className="w-full">{data?.spec || '-'}</p>
      </td>
      <td className="w-[80px] px-3">
        <p className="w-full">{data?.unit || '-'}</p>
      </td>
      <td className="flex-1 px-3">
        <input
          type="text"
          value={data?.quantity?.toLocaleString() || ''}
          className="w-full outline-none min-w-0 max-w-full overflow-hidden text-ellipsis"
          style={{ width: '100%', maxWidth: '100%' }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const value = e.target.value;
            const numericValue = value.replace(/[^0-9]/g, '');
            onChange?.('quantity', numericValue);
          }}
        />
      </td>
      <td className="w-[100px] px-3">
        <input
          type="text"
          value={data?.unit_price?.toLocaleString() || ''}
          className="w-full outline-none min-w-0 max-w-full overflow-hidden text-ellipsis"
          style={{ width: '100%', maxWidth: '100%' }}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const value = e.target.value;
            const numericValue = value.replace(/[^0-9]/g, '');
            onChange?.('unit_price', numericValue);
          }}
        />
      </td>
      <td className="flex-1 px-3 min-w-0">
        <p className="w-full min-w-0 max-w-full overflow-hidden text-ellipsis truncate whitespace-nowrap">
          {data?.quantity && data?.unit_price
            ? (data.quantity * data.unit_price).toLocaleString()
            : '-'}
        </p>
      </td>
      {canDelete && (
        <td className="w-8 h-full flex justify-center items-center">
          <button
            className="flex items-center justify-center w-full h-8 rounded-[8px] hover:bg-bg cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <X size={16} className="text-sv" />
          </button>
        </td>
      )}
    </tr>
  );
};

export default ProductItem;
