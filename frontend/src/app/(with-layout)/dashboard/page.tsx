'use client'

import { useEffect, Suspense } from 'react'
import MainTitleSec from './main-title-sec'
import DailyProductionQuantity from './summary-KPI/daily-production-quantity'
import ShortageCount from './summary-KPI/shortage-count'
import ProductionYield from './summary-KPI/production-yield'
import DeliveryTable from './delivery-schedule/delivery-table'
import PendingQuote from './pending-quote'
import ProcessProject from './process-project'
import Tax from './tax'
import TodayProductionSchedule from './today-production-schedule'
import ProfitGraph from './profit-graph'
import useToast from '@/hooks/use-toast'
import Toast from '@/ui/toast'
import { useSearchParams } from 'next/navigation'
import { CheckCircle } from '@phosphor-icons/react'
import Spinner from '@/ui/spinner'

const DashboardPageContent = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000)
  const searchParams = useSearchParams()

  useEffect(() => {
    const from = searchParams.get('from')
    if (from === 'onboarding') {
      showToast()
    }
  }, [searchParams, showToast])

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
        <PendingQuote />

        {/* 생산 프로젝트 */}
        <ProcessProject />

        {/* 오늘의 생산 일정 */}
        <TodayProductionSchedule />

        {/* 납품 예정 현황 */}
        <div className="flex gap-5">
          <div className="flex flex-col flex-1 min-w-0 gap-3">
            <div className="h-10 flex items-center">
              <h3 className="Heading-3">납품 예정 현황</h3>
            </div>
            <DeliveryTable />
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
  )
}

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
  )
}

export default DashboardPage
