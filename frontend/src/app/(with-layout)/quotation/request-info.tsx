import MiniBtn from '@/ui/mini-btn';
import ProductItem from './product-item';
import { CaretDown } from '@phosphor-icons/react/dist/ssr';
import { useGetQuotationProducts, useGetProduct } from '@/hooks';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { ProductResponseModel } from '@/types/data-model';
import ProductEnrollmentDropdown from './modals/product-enrollment-dropdown';

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

  const searchParams = useSearchParams();
  const quotationId = searchParams.get('id')
    ? parseInt(searchParams.get('id') || '0')
    : undefined;

  const {
    data: quotationProducts,
    isLoading,
    error,
  } = useGetQuotationProducts(quotationId);
  const [productDetails, setProductDetails] = useState<
    Record<number, ProductResponseModel>
  >({});

  const { getProductDetail } = useGetProduct();

  // 제품 상세 정보 가져오기
  const fetchProductDetails = useCallback(
    async (productIds: number[]) => {
      const uniqueProductIds = [...new Set(productIds)];

      for (const productId of uniqueProductIds) {
        try {
          const result = await getProductDetail(productId);
          if (result.success && result.data) {
            setProductDetails((prev) => ({
              ...prev,
              [productId]: result.data,
            }));
          }
        } catch (err) {
          throw new Error(`제품 ${productId} 정보 가져오기 실패: ${err}`);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [getProductDetail]
  );

  // quotationProducts가 변경될 때마다 제품 상세 정보 가져오기
  useEffect(() => {
    if (quotationProducts && quotationProducts.length > 0) {
      const productIds = quotationProducts.map((item) => item.product);
      fetchProductDetails(productIds);
      setHasQuotationProducts(true);
    } else {
      setHasQuotationProducts(false);
    }
  }, [quotationProducts, fetchProductDetails, setHasQuotationProducts]);

  return (
    <>
      <div className="flex justify-between items-center relative">
        <h3 className="Heading-3">요청정보</h3>
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
            />
          </div>
        )}
      </div>

      {!isLoading &&
      !error &&
      quotationProducts &&
      quotationProducts.length > 0 ? (
        <div className="w-full overflow-x-auto mb-30 ">
          <table className="w-full min-w-[938px]">
            <thead>
              <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
                <th className="text-left px-3 flex-1">품목명</th>
                <th className="text-left px-3 flex-1">품목 코드</th>
                <th className="text-left px-3 flex-1">규격</th>
                <th className="text-left px-3 w-[80px]">단위</th>
                <th className="text-left px-3 flex-1">제작수량</th>
                <th className="text-left px-3 w-[100px]">단가</th>
                <th className="text-left px-3 flex-1">금액</th>
              </tr>
            </thead>
            <tbody>
              {quotationProducts.map((item, index) => {
                const productDetail = productDetails[item.product];

                // 제품 상세 정보를 포함한 데이터 생성
                const displayData = {
                  ...item,
                  productName: productDetail?.name || '-',
                  productCode: productDetail?.code || '-',
                  size: productDetail?.spec || '-',
                  unit: productDetail?.unit || '-',
                };

                return (
                  <ProductItem
                    key={item.id || index}
                    data={displayData}
                    onClick={() => onProductClick(item.product)}
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
    </>
  );
};

export default RequestInfo;
