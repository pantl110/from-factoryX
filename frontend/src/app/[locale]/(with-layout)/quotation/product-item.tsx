import { QuotationProductDetailResponseModel } from '@/types/data-model';
import { X } from '@phosphor-icons/react';
import { useState } from 'react';
import { usePortalDropdown } from '@/hooks/use-portal-dropdown';
import { ArrowLineUpRight } from '@phosphor-icons/react/dist/ssr';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface ProductItemProps {
  data?: QuotationProductDetailResponseModel;
  onClick?: () => void;
  canDelete?: boolean;
  onChange?: (field: 'quantity' | 'unit_price', value: string) => void;
  onDelete?: () => void;
  onDropdownShow?: (searchTerm: string, rect?: DOMRect) => void;
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
  const tCommon = useTranslations('common');
  const tProductItem = useTranslations('quotation.productItem');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const [searchTerm, setSearchTerm] = useState('');
  const { openDropdown, anchorRect } = usePortalDropdown();

  // 검색어 변경 시 드롭다운 표시
  const handleSearchTermChange = (value: string) => {
    setSearchTerm(value);
    if (value.length > 0) {
      onDropdownShow?.(value, anchorRect || undefined);
    } else {
      onDropdownHide?.();
    }
  };

  return (
    <>
      <tr
        className={`flex Me_Body-1 text-dg border-b border-lg transition-all duration-200 ease-in-out ${
          !onlyRead
            ? 'group hover:border hover:border-primary cursor-pointer h-14 items-center'
            : 'items-start py-[15px]'
        }`}
        onClick={!onlyRead ? onClick : undefined}
      >
        <td
          className="flex-[1.5] px-3 flex items-center gap-1 relative min-w-0"
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
              <p className="truncate min-w-0 flex-1">{data.product_name}</p>
              {!onlyRead && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onProductDetailClick?.(data?.productId || null);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-bg cursor-pointer transition-all duration-200 ease-in-out flex-shrink-0"
                >
                  <ArrowLineUpRight size={16} />
                </div>
              )}
            </>
          ) : (
            <input
              type="text"
              placeholder={tProductItem('searchProductName')}
              className="w-full outline-none min-w-0"
              value={searchTerm}
              onChange={(e) => {
                handleSearchTermChange(e.target.value);
              }}
              disabled={isViewer || !hasSubscription()}
            />
          )}
        </td>
        <td className="flex-1 px-3 min-w-0">
          <p
            className="w-full truncate min-w-0"
            title={data?.product_code || ''}
          >
            {data?.product_code || ''}
          </p>
        </td>
        <td className="flex-1 px-3 min-w-0">
          <p className="w-full truncate min-w-0" title={data?.spec || ''}>
            {data?.spec || ''}
          </p>
        </td>

        <td
          className="flex-1 px-3 min-w-0"
          onClick={!onlyRead ? (e) => e.stopPropagation() : undefined}
        >
          {onlyRead ? (
            <p
              className="w-full truncate min-w-0"
              title={
                data?.quantity === 0
                  ? ''
                  : data?.quantity?.toLocaleString() || ''
              }
            >
              {data?.quantity === 0
                ? ''
                : data?.quantity?.toLocaleString() || ''}
            </p>
          ) : (
            <input
              type="text"
              placeholder={tCommon('required')}
              value={
                data?.quantity === 0
                  ? ''
                  : data?.quantity?.toLocaleString() || ''
              }
              className="w-full outline-none min-w-0"
              onChange={(e) => {
                const { value } = e.target;
                const numericValue = value.replace(/[^0-9]/g, '');
                onChange?.('quantity', numericValue);
              }}
              disabled={isViewer || !hasSubscription()}
            />
          )}
        </td>
        <td className="flex-[0.8] px-3 min-w-0">
          <p className="w-full truncate min-w-0" title={data?.unit || ''}>
            {data?.unit || ''}
          </p>
        </td>
        <td
          className="flex-1 px-3 min-w-0"
          onClick={!onlyRead ? (e) => e.stopPropagation() : undefined}
        >
          {onlyRead ? (
            <p
              className="w-full truncate min-w-0"
              title={
                data?.unit_price === 0
                  ? ''
                  : data?.unit_price?.toLocaleString() || ''
              }
            >
              {data?.unit_price === 0
                ? ''
                : data?.unit_price?.toLocaleString() || ''}
            </p>
          ) : (
            <input
              type="text"
              placeholder={tCommon('required')}
              value={
                data?.unit_price === 0
                  ? ''
                  : data?.unit_price?.toLocaleString() || ''
              }
              className="w-full outline-none min-w-0"
              onChange={(e) => {
                const { value } = e.target;
                const numericValue = value.replace(/[^0-9]/g, '');
                onChange?.('unit_price', numericValue);
              }}
              disabled={isViewer || !hasSubscription()}
            />
          )}
        </td>
        <td className="flex-1 px-3 min-w-0">
          <p
            className="w-full truncate min-w-0"
            title={
              data?.quantity && data?.unit_price
                ? (data.quantity * data.unit_price).toLocaleString()
                : ''
            }
          >
            {data?.quantity && data?.unit_price
              ? (data.quantity * data.unit_price).toLocaleString()
              : ''}
          </p>
        </td>
        {canDelete && !onlyRead && !isViewer && hasSubscription() && (
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
