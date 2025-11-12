'use client';

import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { ArrowLineUpRight, X } from '@phosphor-icons/react';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import { ProductResponseModel } from '@/types/data-model';
import { useGetProduct } from '@/hooks';
import ProductDetail from '@/app/(with-layout)/stock/product/product-detail';
import IconBtn from '@/ui/icon-btn';
import useMemberStore from '@/store/member-store';

interface TableItemFormDataModel {
  products: Array<{
    productId: number;
    quantity: number;
    unitPrice: number;
    product_name?: string;
    product_code?: string;
    product_spec?: string;
  }>;
}

interface TableItemProps {
  index: number;
  onRemove: () => void;
}

const TableItem = ({ index, onRemove }: TableItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const { watch, setValue, trigger } = useFormContext<TableItemFormDataModel>();
  const { getProductDetail } = useGetProduct();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductResponseModel | null>(null);
  const [productName, setProductName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // 폼 값 감시
  const quantity = watch(`products.${index}.quantity`) || 0;
  const unitPrice = watch(`products.${index}.unitPrice`) || 0;
  const productNameValue = watch(`products.${index}.product_name`);
  const productCode = watch(`products.${index}.product_code`);
  const productSpec = watch(`products.${index}.product_spec`);

  // 금액 자동 계산
  const totalAmount = quantity * unitPrice;

  // 천 단위 구분자 추가 함수
  const formatNumber = (value: number): string => {
    return value.toLocaleString();
  };

  // 입력값을 숫자로 변환하고 폼에 저장하는 함수
  const handleNumberInput = (
    field: 'quantity' | 'unitPrice',
    value: string
  ) => {
    const numericValue = value.replace(/,/g, '');
    const number = numericValue === '' ? 0 : Number(numericValue);
    if (!isNaN(number) && number >= 0) {
      setValue(`products.${index}.${field}`, number, { shouldDirty: true });
      trigger(); // 폼 상태 강제 업데이트
    }
  };

  // 품목 선택 핸들러 (productId 설정 포함)
  const handleProductSelectWithId = (product: ProductResponseModel) => {
    setSelectedProduct(product);
    // productId와 개별 필드들을 폼에 설정
    setValue(`products.${index}.productId`, product.id, { shouldDirty: true });
    setValue(`products.${index}.product_name`, product.name, {
      shouldDirty: true,
    });
    setValue(`products.${index}.product_code`, product.code, {
      shouldDirty: true,
    });
    setValue(`products.${index}.product_spec`, product.spec, {
      shouldDirty: true,
    });
    trigger(); // 폼 상태 강제 업데이트
    // 드롭다운 닫기
    setIsDropdownOpen(false);
    // productName 초기화하여 재검색 방지
    setProductName('');
  };

  return (
    <>
      <div className="group flex items-center h-14 border-b border-lg Me_Body-1 cursor-default">
        <div className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0 relative">
          {productNameValue ? (
            <p className="text-dg w-full truncate" title={productNameValue}>
              {productNameValue}
            </p>
          ) : (
            <input
              type="text"
              value={productName}
              onChange={(e) => {
                const { value } = e.target;
                setProductName(value);
                if (value.length > 0) {
                  setIsDropdownOpen(true);
                } else {
                  setIsDropdownOpen(false);
                }
              }}
              onFocus={() => {
                if (productName.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
              placeholder="품목명"
              className="text-dg outline-none w-full"
            />
          )}
          {(productNameValue || selectedProduct) && (
            <IconBtn
              icon={ArrowLineUpRight}
              size="w-9 h-9"
              iconSize={16}
              onClick={() => setIsOpen(true)}
              groupHover={true}
            />
          )}

          {/* 품목 검색 드롭다운 */}
          {isDropdownOpen && productName && (
            <div className="absolute top-[41px] left-0 right-0 z-10">
              <ProductNameDropdown
                searchTerm={productName}
                onSelect={handleProductSelectWithId}
                onClose={() => setIsDropdownOpen(false)}
                width="w-full"
              />
            </div>
          )}
        </div>
        <p className="flex-1 px-3 text-dg truncate cursor-default">
          {productCode || '-'}
        </p>
        <p className="flex-1 px-3 text-dg truncate cursor-default">
          {productSpec || '-'}
        </p>
        <div className="flex-1 px-3">
          <input
            type="text"
            value={quantity === 0 ? '' : formatNumber(quantity)}
            onChange={(e) => handleNumberInput('quantity', e.target.value)}
            placeholder="(필수)"
            className="text-dg focus:outline-none w-full"
            disabled={isViewer}
          />
        </div>
        <div className="w-[100px] px-3">
          <input
            type="text"
            value={unitPrice === 0 ? '' : formatNumber(unitPrice)}
            onChange={(e) => handleNumberInput('unitPrice', e.target.value)}
            placeholder="(필수)"
            className="text-dg focus:outline-none w-full"
            disabled={isViewer}
          />
        </div>
        <p className="flex-1 px-3 text-dg truncate cursor-default">
          {totalAmount === 0 ? '-' : totalAmount.toLocaleString()}
        </p>
        {!isViewer && (
          <IconBtn
            icon={X}
            size="w-9 h-9"
            iconSize={16}
            onClick={onRemove}
            groupHover={true}
          />
        )}
      </div>

      {isOpen && productNameValue && watch(`products.${index}.productId`) && (
        <ProductDetail
          productId={watch(`products.${index}.productId`)}
          onClose={() => {
            setIsOpen(false);
          }}
          onSuccess={async (productId) => {
            // 품목 수정 성공 시 변경된 품목 정보를 UI에 반영
            if (productId && productId > 0) {
              try {
                const result = await getProductDetail(productId);
                if (result.success && result.data) {
                  // 수정된 품목 정보로 개별 필드들 업데이트
                  setValue(`products.${index}.productId`, result.data.id, {
                    shouldDirty: true,
                  });
                  setValue(`products.${index}.product_name`, result.data.name, {
                    shouldDirty: true,
                  });
                  setValue(`products.${index}.product_code`, result.data.code, {
                    shouldDirty: true,
                  });
                  setValue(`products.${index}.product_spec`, result.data.spec, {
                    shouldDirty: true,
                  });
                  trigger(); // 폼 상태 강제 업데이트
                  // selectedProduct도 업데이트
                  setSelectedProduct(result.data);
                }
              } catch {
                // 에러 무시
              }
            }
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
};

export default TableItem;
