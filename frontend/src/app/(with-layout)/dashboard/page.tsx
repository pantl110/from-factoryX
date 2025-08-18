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
  ProjectListResponseModel,
  PublishedTaxInvoiceResponseModel,
  PublishedTaxInvoiceListResponseModel,
} from '@/types/data-model';
import useFactoryStore from '@/store/factory-store';
import { TodayProductionPlanModel } from './type';
import NoHistoryBox from '@/ui/no-history-box';

const DashboardPageContent = () => {
  const { isToastOpen, isVisible, showToast } = useToast();
  const searchParams = useSearchParams();
  const { getProjects, isLoading: isProjectsLoading } = useGetProjects();
  const { getDashboard, isLoading: isDashboardLoading } = useGetDashboard();
  const { getTodayProductionPlans, isLoading: isTodayPlansLoading } =
    useGetTodayProductionPlans();

  const { getPublishedTaxInvoices, isLoading: isTaxInvoicesLoading } =
    useGetPublishedTaxInvoices();
  const [projectsData, setProjectsData] = useState<ProjectResponseModel[]>([]);
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

  const [taxInvoicesData, setTaxInvoicesData] = useState<
    PublishedTaxInvoiceResponseModel[]
  >([]);
  const { factoryId, initializeFactoryId } = useFactoryStore();

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

  // 프로젝트 데이터 가져오기
  useEffect(() => {
    if (factoryId) {
      getProjects({
        status: 'progress',
        page: 1,
        size: 100,
        order_by: 'start_date',
        order_dir: 'desc',
      }).then(
        (result: { success: boolean; data?: ProjectListResponseModel }) => {
          if (result.success && result.data) {
            const projects = result.data.data || [];
            setProjectsData(Array.isArray(projects) ? projects : []);
          } else {
            setProjectsData([]);
          }
        }
      );
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

  // 세금계산서 데이터 가져오기 (최신 5개)
  useEffect(() => {
    if (factoryId) {
      getPublishedTaxInvoices({
        page: 1,
        page_size: 5,
        ordering: '-transaction_date',
      }).then(
        (result: {
          success: boolean;
          data?: PublishedTaxInvoiceListResponseModel;
        }) => {
          if (result.success && result.data) {
            const invoices = result.data.data || [];
            setTaxInvoicesData(invoices);
          } else {
            setTaxInvoicesData([]);
          }
        }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoryId]);

  // 협의 중인 견적 데이터 (견적 요청, 주문 확정) - 최신순 3개
  const pendingQuotes = Array.isArray(projectsData)
    ? projectsData
        .filter(
          (project) =>
            project.status === 'quotation' || project.status === 'completed'
        )
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )
        .slice(0, 3)
    : [];

  // 생산 프로젝트 데이터 (생산 대기, 생산 중, 생산 완료, 납품) - 최신순 4개
  const processProjects = Array.isArray(projectsData)
    ? projectsData
        .filter(
          (project) =>
            project.status === 'pending' ||
            project.status === 'production' ||
            project.status === 'manufactured' ||
            project.status === 'delivery'
        )
        .sort(
          (a, b) =>
            new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        )
        .slice(0, 4)
    : [];
  return (
    <>
      <MainTitleSec />

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
                {dashboardData ? (
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
                lastYearMonthlyProfits={dashboardData.last_year_monthly_profits}
              />
            </div>

            {/* 견적 및 주문 현황 */}
            <PendingQuote
              projects={pendingQuotes}
              isLoading={isProjectsLoading}
            />

            {/* 생산 프로젝트 */}
            <ProcessProject
              projects={processProjects}
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
        </>
      )}

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
