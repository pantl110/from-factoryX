import {
  QuotationProductDetailResponseModel,
  ProductResponseModel,
} from '@/types/data-model';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import { X } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useGetProduct } from '@/hooks';
import useFactoryStore from '@/store/factory-store';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';

interface ProductItemProps {
  data?: QuotationProductDetailResponseModel;
  onClick?: () => void;
  canDelete?: boolean;
  onChange?: (field: 'quantity' | 'unit_price', value: string) => void;
  onDelete?: () => void;
  onDropdownShow?: (products: ProductResponseModel[], rect?: DOMRect) => void;
  onDropdownHide?: () => void;
  isDropdownActive?: boolean;
}

const ProductItem = ({
  data,
  onClick,
  canDelete = false,
  onChange,
  onDelete,
  onDropdownShow,
  onDropdownHide,
  isDropdownActive,
}: ProductItemProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const { getProductList } = useGetProduct();
  const { factoryId } = useFactoryStore();
  const [filteredProducts, setFilteredProducts] = useState<
    ProductResponseModel[]
  >([]);
  const { isOpen, openDropdown, closeDropdown, anchorRect } =
    usePortalDropdown();

  // 검색어가 변경될 때마다 제품 목록 필터링 (디바운스 300ms)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.length > 0 && factoryId && isOpen) {
        const fetchProducts = async () => {
          try {
            const response = await getProductList({
              factory_id: factoryId,
              q: searchTerm,
            });
            const products = response?.data?.data || [];
            setFilteredProducts(products);
            onDropdownShow?.(products, anchorRect || undefined);
          } catch (error) {
            console.error('Failed to fetch products:', error);
            setFilteredProducts([]);
          }
        };
        fetchProducts();
      } else {
        setFilteredProducts([]);
        onDropdownHide?.();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, factoryId, isOpen]);

  const handleProductSelect = (product: ProductResponseModel) => {
    // 선택된 제품 정보로 데이터 업데이트
    if (onChange) {
      // 여기서 제품 정보를 업데이트하는 로직을 추가할 수 있습니다
      console.log('Selected product:', product);
    }
    setSearchTerm(product.name);
    closeDropdown();
  };

  return (
    <tr
      className="h-14 flex items-center Me_Body-1 text-dg border-b border-lg"
      onClick={onClick}
    >
      <td className="flex-1 px-3 truncate relative" title={data?.product_name}>
        {data?.product_name ? (
          <p className="w-full">{data.product_name}</p>
        ) : (
          <input
            type="text"
            placeholder="품목명을 입력하세요."
            className="w-full outline-none"
            value={searchTerm}
            onClick={(e) => {
              e.stopPropagation();
              openDropdown(e);
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
            }}
          />
        )}
      </td>
      <td className="flex-1 px-3">
        <p className="w-full">{data?.product_code || ''}</p>
      </td>
      <td className="flex-1 px-3">
        <p className="w-full">{data?.spec || ''}</p>
      </td>
      <td className="w-[80px] px-3">
        <p className="w-full">{data?.unit || ''}</p>
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
            : ''}
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
