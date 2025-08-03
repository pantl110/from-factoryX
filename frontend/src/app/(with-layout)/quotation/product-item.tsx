import {
  QuotationProductDetailResponseModel,
  ProductResponseModel,
} from '@/types/data-model';
import { X } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useGetProduct } from '@/hooks';
import useFactoryStore from '@/store/factory-store';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import { ArrowLineUpRight } from '@phosphor-icons/react/dist/ssr';

interface ProductItemProps {
  data?: QuotationProductDetailResponseModel;
  onClick?: () => void;
  canDelete?: boolean;
  onChange?: (field: 'quantity' | 'unit_price', value: string) => void;
  onDelete?: () => void;
  onDropdownShow?: (products: ProductResponseModel[], rect?: DOMRect) => void;
  onDropdownHide?: () => void;
  onProductDetailClick?: (productId: number | null) => void;
  onlyRead?: boolean;
}

const ProductItem = ({
  data,
  onClick,
  canDelete = false,
  onChange,
  onDelete,
  onDropdownShow,
  onDropdownHide,
  onProductDetailClick,
  onlyRead = false,
}: ProductItemProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { getProductList } = useGetProduct();
  const { isOpen, openDropdown, anchorRect } = usePortalDropdown();

  // 검색어가 변경될 때마다 제품 목록 필터링 (디바운스 300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length > 0 && isOpen) {
        const fetchProducts = async () => {
          try {
            const response = await getProductList({
              q: searchTerm,
            });
            const products = response?.data?.data || [];
            onDropdownShow?.(products, anchorRect || undefined);
          } catch {
            throw new Error('Failed to fetch products');
          }
        };
        fetchProducts();
      } else {
        onDropdownHide?.();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isOpen]);

  return (
    <>
      <tr
        className={`h-14 flex items-center Me_Body-1 text-dg border-b border-lg transition-all duration-200 ease-in-out ${
          !onlyRead
            ? 'group hover:border hover:border-primary cursor-pointer'
            : ''
        }`}
        onClick={!onlyRead ? onClick : undefined}
      >
        <td
          className={`flex-1 px-3 flex items-center gap-1 relative ${onlyRead ? 'break-words' : 'truncate'}`}
          title={data?.product_name}
          onClick={
            !onlyRead
              ? (e) => {
                  e.stopPropagation();
                  openDropdown(e);
                }
              : undefined
          }
        >
          {data?.product_name ? (
            <>
              <p className={`${onlyRead ? 'break-words' : 'truncate'}`}>
                {data.product_name}
              </p>
              {!onlyRead && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductDetailClick?.(data?.product_id || null);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-bg cursor-pointer transition-all duration-200 ease-in-out"
                >
                  <ArrowLineUpRight size={16} />
                </div>
              )}
            </>
          ) : (
            <input
              type="text"
              placeholder="품목명 검색"
              className="w-full outline-none"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
            />
          )}
        </td>
        <td className="flex-1 px-3">
          <p className={`w-full ${onlyRead ? 'break-words' : 'truncate'}`}>
            {data?.product_code || ''}
          </p>
        </td>
        <td className="flex-1 px-3">
          <p className={`w-full ${onlyRead ? 'break-words' : 'truncate'}`}>
            {data?.spec || ''}
          </p>
        </td>
        <td className="w-[80px] px-3">
          <p className={`w-full ${onlyRead ? 'break-words' : 'truncate'}`}>
            {data?.unit || ''}
          </p>
        </td>
        <td
          className="flex-1 px-3"
          onClick={!onlyRead ? (e) => e.stopPropagation() : undefined}
        >
          {onlyRead ? (
            <p className="w-full break-words">
              {data?.quantity?.toLocaleString() || ''}
            </p>
          ) : (
            <input
              type="text"
              placeholder="(필수)"
              value={data?.quantity?.toLocaleString() || ''}
              className="w-full outline-none min-w-0 max-w-full overflow-hidden text-ellipsis"
              style={{ width: '100%', maxWidth: '100%' }}
              onChange={(e) => {
                const { value } = e.target;
                const numericValue = value.replace(/[^0-9]/g, '');
                onChange?.('quantity', numericValue);
              }}
            />
          )}
        </td>
        <td
          className="w-[100px] px-3"
          onClick={!onlyRead ? (e) => e.stopPropagation() : undefined}
        >
          {onlyRead ? (
            <p className="w-full break-words">
              {data?.unit_price?.toLocaleString() || ''}
            </p>
          ) : (
            <input
              type="text"
              placeholder="(필수)"
              value={data?.unit_price?.toLocaleString() || ''}
              className="w-full outline-none min-w-0 max-w-full overflow-hidden text-ellipsis"
              style={{ width: '100%', maxWidth: '100%' }}
              onChange={(e) => {
                const { value } = e.target;
                const numericValue = value.replace(/[^0-9]/g, '');
                onChange?.('unit_price', numericValue);
              }}
            />
          )}
        </td>
        <td className="flex-1 px-3 min-w-0">
          <p
            className={`w-full min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap ${onlyRead ? 'break-words' : 'truncate'}`}
          >
            {data?.quantity && data?.unit_price
              ? (data.quantity * data.unit_price).toLocaleString()
              : ''}
          </p>
        </td>
        {canDelete && !onlyRead && (
          <td className="w-9 h-full flex justify-center items-center">
            <button
              className="flex items-center justify-center w-full h-9 rounded-[8px] hover:bg-bg cursor-pointer"
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
    </>
  );
};

export default ProductItem;
