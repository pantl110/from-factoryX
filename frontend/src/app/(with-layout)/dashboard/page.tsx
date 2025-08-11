'use client';

import { useEffect, Suspense, useRef, useState } from 'react';
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
import useToast from '@/hooks/use-toast';
import Toast from '@/ui/toast';
import { useSearchParams } from 'next/navigation';
import { CheckCircle } from '@phosphor-icons/react';
import Spinner from '@/ui/spinner';
import useGetProjects from '@/hooks/project/use-get-projects';
import useGetTodayProductionPlans from '@/hooks/project/use-get-today-production-plans';
import useGetUndeliveredProducts from '@/hooks/project/use-get-undelivered-products';
import { ProjectResponseModel } from '@/types/data-model';

interface TodayProductionPlanModel {
  company_name: string;
  product_name: string;
  product_code: string;
  spec: string;
  unit: string;
  production_quantity: number;
  equipment_name: string;
  production_time: number;
  project_id: number;
}

interface UndeliveredProductModel {
  company_name: string;
  product_name: string;
  delivery_date: string | null;
  project_id: number;
}

const DashboardPageContent = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000);
  const searchParams = useSearchParams();
  const { getProjects, isLoading: projectsLoading } = useGetProjects();
  const { getTodayProductionPlans, isLoading: todayPlansLoading } =
    useGetTodayProductionPlans();
  const { getUndeliveredProducts, isLoading: undeliveredLoading } =
    useGetUndeliveredProducts();
  const hasFetchedProjectsRef = useRef(false);
  const hasFetchedTodayPlansRef = useRef(false);
  const hasFetchedUndeliveredRef = useRef(false);
  const [projectsData, setProjectsData] = useState<ProjectResponseModel[]>([]);
  const [todayProductionPlans, setTodayProductionPlans] = useState<
    TodayProductionPlanModel[]
  >([]);
  const [undeliveredProducts, setUndeliveredProducts] = useState<
    UndeliveredProductModel[]
  >([]);
  const { factoryId, initializeFactoryId } = useFactoryStore();

  useEffect(() => {
    const from = searchParams.get('from');
    if (from === 'onboarding') {
      showToast();
    }
  }, [searchParams, showToast]);

  // 프로젝트 데이터 가져오기
  useEffect(() => {
    if (!hasFetchedProjectsRef.current) {
      hasFetchedProjectsRef.current = true;

      getProjects({
        status: 'progress',
        page: 1,
        size: 100,
        order_by: 'start_date',
        order_dir: 'desc',
      }).then((result) => {
        if (result.success && result.data) {
          const responseData = result.data as any;
          const projects = responseData.data || [];
          setProjectsData(Array.isArray(projects) ? projects : []);
        } else {
          setProjectsData([]);
        }
      });
    }
  }, [getProjects]);

  // 오늘의 생산 일정 가져오기
  useEffect(() => {
    if (!hasFetchedTodayPlansRef.current) {
      hasFetchedTodayPlansRef.current = true;

      getTodayProductionPlans({
        page: 1,
      }).then((result) => {
        if (result.success && result.data) {
          setTodayProductionPlans(result.data);
        } else {
          setTodayProductionPlans([]);
        }
      });
    }
  }, [getTodayProductionPlans]);

  // 납품되지 않은 견적서 품목 가져오기
  useEffect(() => {
    if (!hasFetchedUndeliveredRef.current) {
      hasFetchedUndeliveredRef.current = true;

      getUndeliveredProducts({
        page: 1,
      }).then((result) => {
        if (result.success && result.data) {
          setUndeliveredProducts(result.data);
        } else {
          setUndeliveredProducts([]);
        }
      });
    }
  }, [getUndeliveredProducts]);

  // 협의 중인 견적 데이터 (견적 요청, 주문 확정) - 최신순 3개
  const pendingQuotes = Array.isArray(projectsData)
    ? projectsData
        .filter(
          (project) =>
            project.status === '견적 협의중' || project.status === '주문 확정'
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
            project.status === '생산 대기' ||
            project.status === '생산 중' ||
            project.status === '생산 완료' ||
            project.status === '납품'
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

      <div className="flex flex-col gap-11 p-10">
        <div className="flex gap-5">
          {/* Summary KPI */}
          <div className="flex flex-col gap-3 w-[280px] min-w-[248px]">
            <h3 className="Heading-3">Summary KPI</h3>
            <DailyProductionQuantity />
            <ShortageCount />
            <ProductionYield />
          </div>

          {/* 생산 이익 그래프 */}
          <ProfitGraph />
        </div>

        {/* 협의 중인 견적 */}
        <PendingQuote projects={pendingQuotes} isLoading={projectsLoading} />

        {/* 생산 프로젝트 */}
        <ProcessProject
          projects={processProjects}
          isLoading={projectsLoading}
        />

        {/* 오늘의 생산 일정 */}
        <TodayProductionSchedule
          todayProductionPlans={todayProductionPlans}
          isLoading={todayPlansLoading}
        />

        {/* 납품 예정 현황 */}
        <div className="flex gap-5">
          <div className="flex flex-col flex-1 min-w-0 gap-3">
            <div className="h-10 flex items-center">
              <h3 className="Heading-3">납품 예정 현황</h3>
            </div>
            <DeliveryTable
              undeliveredProducts={undeliveredProducts}
              isLoading={undeliveredLoading}
            />
          </div>

          {/* 세금계산서 현황 */}
          <Tax />
        </div>
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
