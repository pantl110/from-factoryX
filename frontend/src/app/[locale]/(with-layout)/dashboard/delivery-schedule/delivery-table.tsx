'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import DeliveryTableItem from './delivery-table-item';
import Pagination from '@/components/pagination';
import NoHistoryBox from '@/ui/no-history-box';
import { useRouter } from '@/i18n/navigation';
import { useGetUndeliveredProducts } from '@/hooks';
import useMemberStore from '@/store/member-store';

const DeliveryTable = () => {
  const t = useTranslations('dashboard.deliverySchedule');
  const tCommon = useTranslations('common');
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
        title={t('noSchedule')}
        text={t('noScheduleDescription')}
        height="h-full"
      />
    );
  }

  return (
    <div className="flex flex-col justify-between">
      <div>
        <div className="flex w-full h-12 items-center Me_Body-1 text-sv border-t border-b border-[#eeeeee]">
          <p className="px-3 w-[150px]">{tCommon('clientName')}</p>
          <p className="px-3 flex-1">{tCommon('productName')}</p>
          <p className="px-3 flex-1">{tCommon('deliveryDate')}</p>
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
