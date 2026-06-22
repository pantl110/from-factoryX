'use client';

import { Calendar } from '@phosphor-icons/react';
import { useMemo } from 'react';
import { useGetMobileDashboardCounts } from '@/hooks';
import { MobileDashboardCountsResponseModel } from '@/types/data-model';
import { getToday } from '@/utils';
import { useTranslations } from 'next-intl';
import TopBar from './topbar';
import WorkList from './work-list';
import TodoList from './todo-list';
// import Memo from './memo';

const EMPTY_COUNTS: MobileDashboardCountsResponseModel = {
  undelivered_quotation_products: 0,
  shortage_materials: 0,
  expiry_risk_materials: 0,
  stale_confirmed_projects: 0,
  overdue_sales_accounts: 0,
  overdue_purchase_accounts: 0,
};

const MobileDashboardPage = () => {
  const t = useTranslations('mobile.dashboard');
  // 오늘 날짜 사용 (UTC가 아닌 로컬 시간)
  const baseDate = useMemo(() => getToday(), []);
  const { data } = useGetMobileDashboardCounts({ baseDate });
  const dashboardCounts = data ?? EMPTY_COUNTS;

  return (
    <>
      <TopBar />
      <div className="flex flex-col gap-8 py-6 px-4">
        {/* 작업목록 */}
        <WorkList
          data={dashboardCounts}
          // selectedDate={selectedDate}
          // setSelectedDate={setSelectedDate}
        />

        {/* 오늘의 할일 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-green-8 rounded-full ">
              <Calendar size={20} className="text-primary" />
            </div>
            <h4 className="m-Heading-4b">{t('todayTasks')}</h4>
          </div>
          <TodoList data={dashboardCounts} />
        </div>

        {/* 메모 */}
        {/* <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-green-8 rounded-full ">
              <Note size={20} className="text-primary" />
            </div>
            <h4 className="m-Heading-4b">{t('memo')}</h4>
          </div>
          <Memo />
        </div> */}
      </div>
    </>
  );
};

export default MobileDashboardPage;
