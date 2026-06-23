'use client';

import { useEffect, Suspense, useState, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import ReactGridLayout, { useContainerWidth } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
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
  useGetPublishedDocuments,
  useGetDashboard,
  useGetDashboardLayout,
  useUpdateDashboardLayout,
} from '@/hooks';
import {
  ProjectResponseModel,
  DashboardResponseModel,
  WidgetLayoutModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { TodayProductionPlanModel } from './type';
import NoHistoryBox from '@/ui/no-history-box';
import Footer from '@/components/footer';
import MobileDashboardPage from '@/app/[locale]/(mobile)/dashboard';
import { gridLayout, WidgetIdType } from './utils';
import { Account } from './account';
import WidgetSettingsPanel from './modals/widget-settings-panel';

// Default widget layout with visible flag
const getDefaultWidgetLayout = (): WidgetLayoutModel[] =>
  gridLayout.map((item) => ({
    id: item.i,
    visible: true,
    x: item.x,
    y: item.y,
    w: item.w,
    h: item.h,
  }));

const DashboardPageContent = () => {
  const t = useTranslations('dashboard');
  const { isToastOpen, isVisible, showToast } = useToast();
  const searchParams = useSearchParams();
  const { getProjects, isLoading: isProjectsLoading } = useGetProjects();
  const { getDashboard, isLoading: isDashboardLoading } = useGetDashboard();
  const { getTodayProductionPlans, isLoading: isTodayPlansLoading } =
    useGetTodayProductionPlans();
  const {
    data: layoutData,
    isLoading: isLayoutLoading,
    isSuccess: isLayoutSuccess,
  } = useGetDashboardLayout();
  const { updateDashboardLayout } = useUpdateDashboardLayout();
  const { factoryId, initializeFactoryId } = useMemberStore();

  // Widget layout state (from API or default)
  const [widgetLayout, setWidgetLayout] = useState<WidgetLayoutModel[]>(
    getDefaultWidgetLayout()
  );
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // API 응답으로 레이아웃 초기화
  useEffect(() => {
    if (isLayoutSuccess && layoutData?.widgets) {
      setWidgetLayout(layoutData.widgets);
    }
  }, [isLayoutSuccess, layoutData]);

  // Derive hiddenWidgets from widgetLayout for backward compatibility
  const hiddenWidgets = useMemo(
    () =>
      widgetLayout.filter((w) => !w.visible).map((w) => w.id as WidgetIdType),
    [widgetLayout]
  );

  // Save layout to backend
  const saveLayoutToBackend = useCallback(
    (newLayout: WidgetLayoutModel[]) => {
      updateDashboardLayout(newLayout);
    },
    [updateDashboardLayout]
  );

  const toggleWidget = useCallback(
    (widgetId: WidgetIdType) => {
      setWidgetLayout((prev) => {
        const newLayout = prev.map((w) =>
          w.id === widgetId ? { ...w, visible: !w.visible } : w
        );
        saveLayoutToBackend(newLayout);
        return newLayout;
      });
    },
    [saveLayoutToBackend]
  );

  const resetWidgets = useCallback(() => {
    const defaultLayout = getDefaultWidgetLayout();
    setWidgetLayout(defaultLayout);
    saveLayoutToBackend(defaultLayout);
  }, [saveLayoutToBackend]);

  // Handle layout change from ReactGridLayout (position/size)
  const handleLayoutChange = useCallback(
    (
      newGridLayout: readonly {
        i: string;
        x: number;
        y: number;
        w: number;
        h: number;
      }[]
    ) => {
      setWidgetLayout((prev) => {
        const newLayout = prev.map((widget) => {
          const gridItem = newGridLayout.find((item) => item.i === widget.id);
          if (gridItem) {
            return {
              ...widget,
              x: gridItem.x,
              y: gridItem.y,
              w: gridItem.w,
              h: gridItem.h,
            };
          }
          return widget;
        });
        saveLayoutToBackend(newLayout);
        return newLayout;
      });
    },
    [saveLayoutToBackend]
  );

  // Filter layout based on hidden widgets for ReactGridLayout
  const filteredGridLayout = useMemo(() => {
    return widgetLayout
      .filter((w) => w.visible)
      .map((w) => {
        const original = gridLayout.find((g) => g.i === w.id);
        return {
          i: w.id,
          x: w.x,
          y: w.y,
          w: w.w,
          h: w.h,
          minW: original?.minW,
          minH: original?.minH,
          maxH: original?.maxH,
        };
      });
  }, [widgetLayout]);

  const isWidgetVisible = useCallback(
    (widgetId: WidgetIdType) => !hiddenWidgets.includes(widgetId),
    [hiddenWidgets]
  );

  const { data: taxInvoicesQueryData, isLoading: isTaxInvoicesLoading } =
    useGetPublishedDocuments(
      {
        filters: {
          document_type: 'tax', // 세금계산서만 조회
        },
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
  const { width: gridWidth, containerRef } = useContainerWidth({
    initialWidth: 1200,
  });
  const effectiveGridWidth = gridWidth || 1200;

  // PublishedDocumentOutModel에서 세금계산서만 필터링하고 변환
  const taxInvoicesData = (taxInvoicesQueryData?.data || [])
    .filter((doc) => doc.document_type === 'tax' && doc.tax_invoice_type)
    .map((doc) => {
      if (!doc.tax_invoice_type) return null;
      return {
        id: doc.id,
        tax_invoice_type: doc.tax_invoice_type,
        client_info: { name: doc.client_name },
        transaction_date: doc.transaction_date,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  // 모든 데이터 로딩 상태를 통합
  const isLoading =
    isDashboardLoading ||
    isProjectsLoading ||
    isTodayPlansLoading ||
    isTaxInvoicesLoading ||
    isLayoutLoading;

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

  // 견적서 주문서 프로젝트 데이터 12개 가져오기
  useEffect(() => {
    if (factoryId) {
      // 첫 번째 요청: 견적서 주문서 프로젝트 데이터 3개 가져오기
      getProjects({
        status_exclude:
          'pending,production,manufactured,delivery,completed,suspended',
        page: 1,
        page_size: 12,
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

          // 첫 번째 요청 완료 후 두 번째 요청 실행 // 생산중 프로젝트 데이터 12개 가져오기
          return getProjects({
            status_exclude: 'quotation,confirmed,completed,suspended',
            page: 1,
            page_size: 12,
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
        <MainTitleSec onOpenSettings={() => setIsSettingsPanelOpen(true)} />
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
              <div ref={containerRef} className="w-full">
                {effectiveGridWidth > 0 && (
                  <ReactGridLayout
                    className="layout"
                    layout={filteredGridLayout}
                    width={effectiveGridWidth}
                    gridConfig={{
                      cols: 4,
                      rowHeight: 80,
                      margin: [24, 32],
                      containerPadding: [0, 0],
                    }}
                    resizeConfig={{
                      enabled: true,
                      handles: ['se', 'e', 's'],
                    }}
                    dragConfig={{ enabled: true }}
                    onLayoutChange={handleLayoutChange}
                  >
                    {/* Summary KPI */}
                    {isWidgetVisible('summaryKpi') && (
                      <div
                        key="summaryKpi"
                        className="flex flex-col h-full min-h-0"
                      >
                        <h3 className="Heading-3">{t('summaryKPITitle')}</h3>
                        {factoryId && dashboardData ? (
                          <div className="flex flex-col gap-3 mt-3 h-full min-h-0 overflow-visible">
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
                          <div className="mt-3 h-full min-h-0 overflow-auto">
                            <NoHistoryBox
                              title={t('noSummaryData')}
                              text={t('noSummaryDataDescription')}
                              height="h-full"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 생산 수익 그래프 */}
                    {isWidgetVisible('profitGraph') && (
                      <div
                        key="profitGraph"
                        className="flex flex-col h-full min-h-0"
                      >
                        <ProfitGraph
                          monthlyProfits={dashboardData.monthly_profits}
                          lastYearMonthlyProfits={
                            dashboardData.last_year_monthly_profits
                          }
                        />
                      </div>
                    )}

                    {/* 견적 및 주문 현황 */}
                    {isWidgetVisible('pendingQuote') && (
                      <div
                        key="pendingQuote"
                        className="flex flex-col h-full min-h-0"
                      >
                        <PendingQuote
                          projects={quotationProjectsData}
                          isLoading={isProjectsLoading}
                        />
                      </div>
                    )}

                    {/* 생산 프로젝트 */}
                    {isWidgetVisible('processProject') && (
                      <div
                        key="processProject"
                        className="flex flex-col h-full min-h-0"
                      >
                        <ProcessProject
                          projects={productionProjectsData}
                          isLoading={isProjectsLoading}
                        />
                      </div>
                    )}

                    {/* 오늘의 생산 일정 */}
                    {isWidgetVisible('todaySchedule') && (
                      <div
                        key="todaySchedule"
                        className="flex flex-col h-full min-h-0"
                      >
                        <TodayProductionSchedule
                          todayProductionPlans={todayProductionPlans}
                          isLoading={isTodayPlansLoading}
                        />
                      </div>
                    )}

                    {/* 납품 예정 현황 */}
                    {isWidgetVisible('deliverySchedule') && (
                      <div
                        key="deliverySchedule"
                        className="flex flex-col h-full min-h-0 gap-3"
                      >
                        <div className="h-10 flex items-center">
                          <h3 className="Heading-3">
                            {t('deliveryScheduleTitle')}
                          </h3>
                        </div>
                        <div className="flex-1 min-h-0 overflow-auto h-full">
                          <DeliveryTable />
                        </div>
                      </div>
                    )}

                    {/* 세금계산서 현황 */}
                    {isWidgetVisible('taxStatus') && (
                      <div
                        key="taxStatus"
                        className="flex flex-col h-full min-h-0"
                      >
                        <Tax
                          taxInvoicesData={taxInvoicesData}
                          isLoading={isTaxInvoicesLoading}
                        />
                      </div>
                    )}

                    {/* 채권채무 현황 */}
                    {isWidgetVisible('account') && (
                      <div
                        key="account"
                        className="flex flex-col h-full min-h-0"
                      >
                        <Account />
                      </div>
                    )}
                  </ReactGridLayout>
                )}
              </div>
            </div>

            <Footer />
          </>
        )}
      </div>

      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={20} className="text-primary" />}
          text={t('onboardingToastText')}
          subtext={t('onboardingToastSubtext')}
          type="primary"
          isVisible={isVisible}
        />
      )}

      {/* Widget Settings Panel */}
      {isSettingsPanelOpen && (
        <WidgetSettingsPanel
          hiddenWidgets={hiddenWidgets}
          onToggleWidget={toggleWidget}
          onReset={resetWidgets}
          onClose={() => setIsSettingsPanelOpen(false)}
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
