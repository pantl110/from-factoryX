'use client';

import { useMemo, useState } from 'react';
import DeliveryTableItem from './delivery-table-item';
import Pagination from '@/components/pagination';
import NoHistoryBox from '@/ui/no-history-box';
import { useRouter } from 'next/navigation';
import { useGetUndeliveredProducts } from '@/hooks';
import useMemberStore from '@/store/member-store';

const DeliveryTable = () => {
  const router = useRouter();
  const { factoryId } = useMemberStore();
  const [currentPage, setCurrentPage] = useState(1);
  const {
    data: undeliveredProducts,
    isLoading,
    isError,
  } = useGetUndeliveredProducts({
    page: currentPage,
  });

  const fallbackData = useMemo(
    () => ({
      count: 0,
      totalCnt: 0,
      pageCnt: 0,
      curPage: currentPage,
      data: [],
    }),
    [currentPage]
  );

  const resolvedData = undeliveredProducts ?? fallbackData;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!factoryId || isLoading || isError || resolvedData.data.length === 0) {
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
          <p className="px-3 w-[150px]">거래처명</p>
          <p className="px-3 flex-1">제품명</p>
          <p className="px-3 flex-1">납품일자</p>
          <div className="w-10"></div>
        </div>
        {resolvedData.data.map((product, index) => (
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
      {resolvedData.pageCnt > 1 && (
        <Pagination
          currentPage={resolvedData.curPage}
          totalPages={resolvedData.pageCnt}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default DeliveryTable;
