'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useFormContext } from 'react-hook-form';
import { ArrowLineUpRight, X } from '@phosphor-icons/react';
import { ProductNameDropdown } from '@/ui/dropdown/product-name-dropdown';
import { ProductResponseModel } from '@/types/data-model';
import { useGetProduct, useDropdownFilter } from '@/hooks';
import ProductDetail from '@/app/(with-layout)/stock/product/product-detail';

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
  const { watch, setValue } = useFormContext<TableItemFormDataModel>();
  const { getProductDetail, getProductList } = useGetProduct();

  const [isOpen, setIsOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] =
    useState<ProductResponseModel | null>(null);
  const [productList, setProductList] = useState<ProductResponseModel[]>([]);

  const {
    input: productName,
    setInput: setProductName,
    isOpen: isDropdownOpen,
    setIsOpen: setIsDropdownOpen,
    filtered: dropdownItems,
    handleInputChange: handleProductNameChange,
    handleSelect: handleProductSelect,
  } = useDropdownFilter<ProductResponseModel>(productList, (item) => item.name);

  // 디바운스된 productName (300ms 후에 API 호출)
  const [debouncedProductName] = useDebounce(productName, 300);

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
      setValue(`products.${index}.${field}`, number);
    }
  };

  // debouncedProductName이 변경될 때마다 API 호출 (300ms 디바운스)
  useEffect(() => {
    const fetchProducts = async () => {
      if (!debouncedProductName.trim()) {
        setProductList([]);
        setIsDropdownOpen(false); // 드롭다운 닫기
        return;
      }

      try {
        // 먼저 totalCnt를 가져오기 위해 size: 1로 호출
        const countResult = await getProductList({
          q: debouncedProductName,
          page_size: 1,
        });

        if (!countResult.success || !countResult.data) {
          setProductList([]);
          return;
        }

        const totalCount = countResult.data.totalCnt || 0;
        if (totalCount === 0) {
          setProductList([]);
          return;
        }

        // totalCnt만큼 사이즈로 전체 데이터 가져오기
        const result = await getProductList({
          q: debouncedProductName,
          page_size: totalCount,
        });

        if (result.success && result.data && result.data.data.length > 0) {
          setProductList(result.data.data);
          setIsDropdownOpen(true); // 드롭다운 열기
        } else {
          setProductList([]);
          setIsDropdownOpen(false); // 드롭다운 닫기
        }
      } catch {
        setProductList([]);
        setIsDropdownOpen(false); // 에러 시 드롭다운 닫기
      }
    };

    fetchProducts();
  }, [debouncedProductName, getProductList, setIsDropdownOpen, setProductList]);

  // 품목 선택 핸들러 (productId 설정 포함)
  const handleProductSelectWithId = (product: ProductResponseModel) => {
    setSelectedProduct(product);
    handleProductSelect(product);
    // productId와 개별 필드들을 폼에 설정
    setValue(`products.${index}.productId`, product.id);
    setValue(`products.${index}.product_name`, product.name);
    setValue(`products.${index}.product_code`, product.code);
    setValue(`products.${index}.product_spec`, product.spec);
    // 드롭다운 닫기
    setIsDropdownOpen(false);
    // productName 초기화하여 재검색 방지
    setProductName('');
    // productList 초기화
    setProductList([]);
  };

  return (
    <>
      <div className="group flex items-center h-14 border-b border-lg Me_Body-1 cursor-pointer">
        <div className="flex-1 px-3 flex items-center gap-1 min-w-0 relative">
          {productNameValue ? (
            <p className="text-dg w-full truncate" title={productNameValue}>
              {productNameValue}
            </p>
          ) : (
            <input
              type="text"
              value={productName}
              onChange={handleProductNameChange}
              placeholder="품목명"
              className="text-dg outline-none w-full"
            />
          )}
          {(productNameValue || selectedProduct) && (
            <button
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-[8px] hover:bg-bg transition-colors duration-200 group-hover:opacity-100 opacity-0"
              onClick={() => {
                setIsOpen(true);
              }}
            >
              <ArrowLineUpRight size={16} className="text-dg" />
            </button>
          )}

          {/* 품목 검색 드롭다운 */}
          {isDropdownOpen && dropdownItems.length > 0 && (
            <div className="absolute top-[41px] left-0 right-0 z-10">
              <ProductNameDropdown
                items={dropdownItems}
                onSelect={handleProductSelectWithId}
                onClose={() => setIsDropdownOpen(false)}
                width="w-full"
              />
            </div>
          )}
        </div>
        <p className="flex-1 px-3 text-dg truncate">{productCode || ''}</p>
        <p className="flex-1 px-3 text-dg truncate">{productSpec || ''}</p>
        <div className="flex-1 px-3">
          <input
            type="text"
            value={quantity === 0 ? '' : formatNumber(quantity)}
            onChange={(e) => handleNumberInput('quantity', e.target.value)}
            placeholder="(필수)"
            className="text-dg focus:outline-none w-full"
          />
        </div>
        <div className="w-[100px] px-3">
          <input
            type="text"
            value={unitPrice === 0 ? '' : formatNumber(unitPrice)}
            onChange={(e) => handleNumberInput('unitPrice', e.target.value)}
            placeholder="(필수)"
            className="text-dg focus:outline-none w-full"
          />
        </div>
        <p className="flex-1 px-3 text-dg truncate">
          {totalAmount === 0 ? '-' : totalAmount.toLocaleString()}
        </p>
        <button
          className="w-9 h-9 rounded-[8px] flex items-center justify-center hover:bg-bg"
          onClick={onRemove}
        >
          <X size={16} className="text-sv" />
        </button>
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
                  setValue(`products.${index}.productId`, result.data.id);
                  setValue(`products.${index}.product_name`, result.data.name);
                  setValue(`products.${index}.product_code`, result.data.code);
                  setValue(`products.${index}.product_spec`, result.data.spec);
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
