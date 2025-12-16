'use client';

import { useEffect, Suspense, useState } from 'react';
import MainTitleSec from './main-title-sec';
import DailyProductionQuantity from './summary-KPI/daily-production-quantity';
import ShortageCount from './summary-KPI/shortage-count';
import ProductionYield from './summary-KPI/production-yield';
import DeliveryTable from './delivery-schedule/delivery-table';
import PendingQuote from './pending-quote';
import ProcessProject from './process-project';
import Tax from './tax';
import TodayProductionSchedule from './today-production-schedule';
import ProfitGraph from './profit-graph';
import Toast from '@/ui/toast';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from '@phosphor-icons/react';
import Spinner from '@/ui/spinner';
import {
  useToast,
  useGetProjects,
  useGetTodayProductionPlans,
  useGetPublishedTaxInvoices,
  useGetDashboard,
} from '@/hooks';
import {
  ProjectResponseModel,
  DashboardResponseModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { TodayProductionPlanModel } from './type';
import NoHistoryBox from '@/ui/no-history-box';
import Footer from '@/components/footer';
import MobileDashboardPage from '@/app/(mobile)/dashboard';

const DashboardPageContent = () => {
  const { isToastOpen, isVisible, showToast } = useToast();
  const searchParams = useSearchParams();
  const { getProjects, isLoading: isProjectsLoading } = useGetProjects();
  const { getDashboard, isLoading: isDashboardLoading } = useGetDashboard();
  const { getTodayProductionPlans, isLoading: isTodayPlansLoading } =
    useGetTodayProductionPlans();
  const { factoryId, initializeFactoryId } = useMemberStore();

  const { data: taxInvoicesQueryData, isLoading: isTaxInvoicesLoading } =
    useGetPublishedTaxInvoices(
      {
        page: 1,
        page_size: 5,
        ordering: '-transaction_date',
      },
      { enabled: Boolean(factoryId) }
    );
  const [quotationProjectsData, setQuotationProjectsData] = useState<
    ProjectResponseModel[]
  >([]);
  const [productionProjectsData, setProductionProjectsData] = useState<
    ProjectResponseModel[]
  >([]);
  const [dashboardData, setDashboardData] = useState<DashboardResponseModel>({
    current_month_projects: 0,
    previous_month_projects: 0,
    shortage_materials_count: 0,
    monthly_profits: [],
    last_year_monthly_profits: [],
  });
  const [todayProductionPlans, setTodayProductionPlans] = useState<
    TodayProductionPlanModel[]
  >([]);

  const taxInvoicesData = taxInvoicesQueryData?.data || [];

  // 모든 데이터 로딩 상태를 통합
  const isLoading =
    isDashboardLoading ||
    isProjectsLoading ||
    isTodayPlansLoading ||
    isTaxInvoicesLoading;

  useEffect(() => {
    const from = searchParams.get('from');
    if (from === 'onboarding') {
      showToast();
    }
  }, [searchParams, showToast]);

  // factoryId가 null이면 초기화
  useEffect(() => {
    if (!factoryId) {
      initializeFactoryId();
    }
  }, [factoryId, initializeFactoryId]);

  // 견적서 주문서 프로젝트 데이터 3개 가져오기
  useEffect(() => {
    if (factoryId) {
      // 첫 번째 요청: 견적서 주문서 프로젝트 데이터 3개 가져오기
      getProjects({
        status_exclude:
          'pending,production,manufactured,delivery,completed,suspended',
        page: 1,
        page_size: 3,
        order_by: '-created_at',
      })
        .then((quotationResult) => {
          // 요청이 취소된 경우 무시
          if (quotationResult.error === '요청이 취소되었습니다.') {
            return;
          }

          // 견적서 주문서 프로젝트 데이터 처리
          if (quotationResult.success && quotationResult.data) {
            const projects = quotationResult.data.data || [];
            setQuotationProjectsData(Array.isArray(projects) ? projects : []);
          } else {
            setQuotationProjectsData([]);
          }

          // 첫 번째 요청 완료 후 두 번째 요청 실행 // 생산중 프로젝트 데이터 4개 가져오기
          return getProjects({
            status_exclude: 'quotation,confirmed,completed,suspended',
            page: 1,
            page_size: 4,
            order_by: '-start_date',
          });
        })
        .then((productionResult) => {
          // 요청이 취소된 경우 무시
          if (productionResult?.error === '요청이 취소되었습니다.') {
            return;
          }

          // 생산중 프로젝트 데이터 처리
          if (productionResult?.success && productionResult?.data) {
            const projects = productionResult.data.data || [];
            setProductionProjectsData(Array.isArray(projects) ? projects : []);
          } else {
            setProductionProjectsData([]);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  useEffect(() => {
    if (factoryId) {
      getDashboard().then(
        (result: { success: boolean; data?: DashboardResponseModel }) => {
          if (result.success && result.data) {
            setDashboardData(result.data);
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  // 오늘의 생산 일정 가져오기
  useEffect(() => {
    if (factoryId) {
      getTodayProductionPlans().then(
        (result: {
          success: boolean;
          data?: TodayProductionPlanModel[];
          error?: string;
        }) => {
          if (result.success && result.data) {
            setTodayProductionPlans(result.data);
          } else {
            setTodayProductionPlans([]);
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  return (
    <>
      {/* 데스크톱에서만 MainTitleSec 표시 */}
      <div className="hidden sm:block">
        <MainTitleSec />
      </div>

      {/* 모바일 640px 이하에서는 빈 화면 표시 */}
      <div className="block sm:hidden">
        <MobileDashboardPage />
      </div>

      {/* 데스크톱에서는 기존 내용 표시 */}
      <div className="hidden sm:block">
        {isLoading ? (
          <div className="flex flex-col h-100 justify-center items-center">
            <Spinner />
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-11 p-10">
              <div className="flex  gap-5">
                {/* Summary KPI */}
                <div className="flex flex-col">
                  <h3 className="Heading-3">Summary KPI</h3>
                  {factoryId && dashboardData ? (
                    <div className="flex flex-col gap-3 w-[280px] min-w-[248px] mt-3">
                      <DailyProductionQuantity
                        currentMonthProjects={
                          dashboardData.current_month_projects
                        }
                        previousMonthProjects={
                          dashboardData.previous_month_projects
                        }
                      />
                      <ShortageCount
                        shortageMaterialsCount={
                          dashboardData.shortage_materials_count
                        }
                      />
                      <ProductionYield
                        monthlyProfits={dashboardData.monthly_profits}
                      />
                    </div>
                  ) : (
                    <div className="w-100 mt-3">
                      <NoHistoryBox
                        title="요약할 데이터가 없어요."
                        text="시스템을 계속 사용하면 주요 지표가 자동으로 요약돼요."
                      />
                    </div>
                  )}
                </div>

                {/* 생산 이익 그래프 */}
                <ProfitGraph
                  monthlyProfits={dashboardData.monthly_profits}
                  lastYearMonthlyProfits={
                    dashboardData.last_year_monthly_profits
                  }
                />
              </div>

              {/* 견적 및 주문 현황 */}
              <PendingQuote
                projects={quotationProjectsData}
                isLoading={isProjectsLoading}
              />

              {/* 생산 프로젝트 */}
              <ProcessProject
                projects={productionProjectsData}
                isLoading={isProjectsLoading}
              />

              {/* 오늘의 생산 일정 */}
              <TodayProductionSchedule
                todayProductionPlans={todayProductionPlans}
                isLoading={isTodayPlansLoading}
              />

              {/* 납품 예정 현황 */}
              <div className="flex gap-5">
                <div className="flex flex-col flex-1 min-w-0 gap-3">
                  <div className="h-10 flex items-center">
                    <h3 className="Heading-3">납품 예정 현황</h3>
                  </div>
                  <DeliveryTable />
                </div>

                {/* 세금계산서 현황 */}
                <Tax
                  taxInvoicesData={taxInvoicesData}
                  isLoading={isTaxInvoicesLoading}
                />
              </div>
            </div>

            <Footer />
          </>
        )}
      </div>

      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={20} className="text-primary" />}
          text="이제 팩토리엑스를 시작해볼까요?"
          subtext="가입이 완료되었어요!"
          type="primary"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

const DashboardPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
};

export default DashboardPage;
