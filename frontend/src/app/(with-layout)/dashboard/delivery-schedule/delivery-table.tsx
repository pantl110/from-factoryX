'use client';

import { useState, useEffect } from 'react';
import DeliveryTableItem from './delivery-table-item';
import Pagination from '@/components/pagination';
import NoHistoryBox from '@/ui/no-history-box';
import { useRouter } from 'next/navigation';
import { UndeliveredProductListResponseModel } from '@/types/data-model';
import useGetUndeliveredProducts from '@/hooks/dashboard/use-get-undelivered-products';
import useMemberStore from '@/store/member-store';

const DeliveryTable = () => {
  const router = useRouter();
  const { factoryId } = useMemberStore();
  const { getUndeliveredProducts, isLoading } = useGetUndeliveredProducts();

  const [undeliveredProducts, setUndeliveredProducts] =
    useState<UndeliveredProductListResponseModel>({
      count: 0,
      totalCnt: 0,
      pageCnt: 0,
      curPage: 1,
      data: [],
    });
  const [currentPage, setCurrentPage] = useState(1);

  // 데이터 로드
  useEffect(() => {
    if (factoryId) {
      getUndeliveredProducts({ page: currentPage }).then(
        (result: {
          success: boolean;
          data?: UndeliveredProductListResponseModel;
        }) => {
          if (result.success && result.data) {
            setUndeliveredProducts(result.data);
          } else {
            setUndeliveredProducts({
              count: 0,
              totalCnt: 0,
              pageCnt: 0,
              curPage: currentPage,
              data: [],
            });
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId, currentPage]);

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isLoading || undeliveredProducts.data.length === 0) {
    return (
      <NoHistoryBox
        title="납품 일정이 없어요."
        text="가장 가까운 납품 일정부터 순서대로 보여져요."
      />
    );
  }

  return (
    <div className="flex flex-col justify-between">
      <div>
        <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
          <p className="px-3 w-[150px]">업체명</p>
          <p className="px-3 flex-1">품목명</p>
          <p className="px-3 flex-1">납품일자</p>
          <div className="w-10"></div>
        </div>
        {undeliveredProducts.data.map((product, index) => (
          <DeliveryTableItem
            key={`${product.project_id}-${index}`}
            projectName={product.company_name}
            productName={product.product_name}
            date={product.delivery_date || '-'}
            onClick={() => {
              router.push(`/production/${product.project_id}`);
            }}
          />
        ))}
      </div>
      {/* 페이지네이션 - 백엔드 페이지네이션 정보 사용 */}
      {undeliveredProducts.pageCnt > 1 && (
        <Pagination
          currentPage={undeliveredProducts.curPage}
          totalPages={undeliveredProducts.pageCnt}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default DeliveryTable;
