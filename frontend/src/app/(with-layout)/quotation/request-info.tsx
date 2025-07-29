import MiniBtn from '@/ui/mini-btn';
import ProductItem from './product-item';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useGetDetailQuotation, useGetProduct } from '@/hooks';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { QuotationProductDetailResponseModel } from '@/types/data-model';
import ProductEnrollmentDropdown from './modals/product-enrollment-dropdown';
import ProductDetail from '../stock/product/product-detail';

interface RequestInfoProps {
  onProductClick: (productId: number) => void;
  setHasQuotationProducts: (hasQuotationProducts: boolean) => void;
}

const RequestInfo = ({
  onProductClick,
  setHasQuotationProducts,
}: RequestInfoProps) => {
  const [isProductEnrollmentDropdownOpen, setIsProductEnrollmentDropdownOpen] =
    useState(false);
  const [isAddOldProductClicked, setIsAddOldProductClicked] = useState(false);
  const [isAddNewProductClicked, setIsAddNewProductClicked] = useState(false);

  const searchParams = useSearchParams();
  const quotationId = searchParams.get('id')
    ? parseInt(searchParams.get('id') || '0')
    : undefined;
  const {
    data: quotationDetail,
    isLoading: isLoadingQuotation,
    error: quotationError,
  } = useGetDetailQuotation(quotationId || 0);
  const { getProductDetail } = useGetProduct();

  // React Hook Form 설정
  const { control, watch, setValue } = useForm({
    defaultValues: {
      products: [] as QuotationProductDetailResponseModel[],
    },
  });

  const { fields, update, append, remove } = useFieldArray({
    control,
    name: 'products',
  });

  // quotationDetail이 변경될 때마다 products를 form에 저장
  useEffect(() => {
    if (
      quotationDetail &&
      quotationDetail.products &&
      quotationDetail.products.length > 0
    ) {
      setValue('products', quotationDetail.products);
      setHasQuotationProducts(true);
    } else {
      setHasQuotationProducts(false);
      setValue('products', []);
    }
  }, [quotationDetail?.products, setHasQuotationProducts, setValue]);

  // 제작수량이나 단가가 변경될 때 금액 자동 계산
  const handleQuantityOrPriceChange = (
    index: number,
    field: 'quantity' | 'unit_price',
    value: string
  ) => {
    const numericValue = value ? parseInt(value.replace(/[^0-9]/g, '')) : null;

    // 현재 필드의 값을 가져와서 업데이트
    const currentField = fields[index];
    update(index, {
      ...currentField,
      [field]: numericValue,
    });
  };

  // 품목 삭제
  const handleDeleteProduct = (index: number) => {
    remove(index);
    // 삭제 후 남은 항목이 없으면 hasQuotationProducts를 false로 설정
    if (fields.length <= 1) {
      setHasQuotationProducts(false);
    }
  };

  // 새로운 품목 추가 시 품목 디테일 판넬에서 저장버튼 누르면
  const handleNewProductAdded = async (productId?: number) => {
    if (productId) {
      const productDetail = await getProductDetail(productId);

      // 새로운 품목을 form에 추가
      const newProduct: QuotationProductDetailResponseModel = {
        product_id: productId,
        product_name: productDetail?.data?.name || '-',
        product_code: productDetail?.data?.code || '-',
        spec: productDetail?.data?.spec || '-',
        unit: productDetail?.data?.unit || '-',
        quantity: null,
        unit_price: null,
        supply_amount: null, // 공급가액
      };

      append(newProduct);
      setHasQuotationProducts(true);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center relative">
        <h3 className="Heading-3">요청 정보</h3>
        <MiniBtn
          text="품목 추가하기"
          textColor="text-dg"
          borderColor="border-lg"
          icon={CaretDown}
          iconPosition="right"
          hoverColor="hover:bg-bg"
          onClick={() => setIsProductEnrollmentDropdownOpen(true)}
        />
        {/* 품목 추가하기 드롭다운 */}
        {isProductEnrollmentDropdownOpen && (
          <div className="absolute top-12 right-0">
            <ProductEnrollmentDropdown
              onClose={() => setIsProductEnrollmentDropdownOpen(false)}
              onAddOldProductClick={() => {
                setIsAddOldProductClicked(true);
                setIsProductEnrollmentDropdownOpen(false);
              }}
              onAddNewProductClick={() => {
                setIsAddNewProductClicked(true);
                setIsProductEnrollmentDropdownOpen(false);
              }}
            />
          </div>
        )}
      </div>

      {!isLoadingQuotation && !quotationError && fields && fields.length > 0 ? (
        <div className="w-full overflow-x-auto mb-30 ">
          <table className="w-full min-w-[938px]">
            <thead>
              <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
                <th className="text-left px-3 flex-1">품목명</th>
                <th className="text-left px-3 flex-1">품목코드</th>
                <th className="text-left px-3 flex-1">규격</th>
                <th className="text-left px-3 w-[80px]">단위</th>
                <th className="text-left px-3 flex-1">제작 수량</th>
                <th className="text-left px-3 w-[100px]">단가</th>
                <th className="text-left px-3 flex-1">금액</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {/* 사용자가 입력한 formData (요청 정보) 표시 */}
              {fields.map((item, index) => {
                return (
                  <ProductItem
                    key={index}
                    data={item}
                    onClick={() => onProductClick(item.product_id || 0)}
                    canDelete={true}
                    onChange={(field, value) => {
                      handleQuantityOrPriceChange(index, field, value);
                    }}
                    onDelete={() => handleDeleteProduct(index)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-8 h-full flex flex-col justify-center items-center gap-2 rounded-[4px] border border-[#E4E4E7]">
          <h4 className="Heading-4 text-dg">요청 정보가 아직 없어요.</h4>
          <p className="R_Body-1 text-gr">
            품목을 추가해서 단가를 측정해 보세요.
          </p>
        </div>
      )}

      {isAddNewProductClicked && (
        <ProductDetail
          productId={null}
          onClose={() => setIsAddNewProductClicked(false)}
          onSuccess={(productId) => {
            handleNewProductAdded(productId);
            setIsAddNewProductClicked(false);
          }}
        />
      )}
    </>
  );
};

export default RequestInfo;
