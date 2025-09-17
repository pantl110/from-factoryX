'use client';

import MiniBtn from '@/ui/mini-btn';
import { useEffect, useMemo, useRef, useState } from 'react';
import ProductionDocumentView from '../../document/production-document-view';
import OverlayView from '@/ui/ovelay-view';
import { X } from '@phosphor-icons/react/dist/ssr';
import { useReactToPrint } from 'react-to-print';
import { TodayProductionPlanModel } from '@/app/(with-layout)/dashboard/type';
import ProductionTable from './production-table';
import useMemberStore from '@/store/member-store';
import useGetWorkInstructions from '@/hooks/document/work-instruction/use-get-work-instructions';
import useUpdateWorkInstruction from '@/hooks/document/work-instruction/use-update-work-instruction';

interface TodayProductionScheduleProps {
  todayProductionPlans: TodayProductionPlanModel[];
  isLoading: boolean;
}

const TodayProductionSchedule = ({
  todayProductionPlans,
  isLoading,
}: TodayProductionScheduleProps) => {
  const factoryId = useMemberStore((state) => state.factoryId);
  const [isPrintOverlayOpen, setIsPrintOverlayOpen] = useState(false);
  const [latestWorkInstructionId, setLatestWorkInstructionId] = useState<
    number | null
  >(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: '생산 지시서', // 문서 제목
  });

  const { getWorkInstructions } = useGetWorkInstructions();
  const { updateWorkInstruction } = useUpdateWorkInstruction();
  const [currentMemo, setCurrentMemo] = useState('');

  useEffect(() => {
    const fetchLatest = async () => {
      if (!factoryId) {
        setLatestWorkInstructionId(null);
        return;
      }
      const res = await getWorkInstructions('-created_at', 1, 1);
      if (
        res.success &&
        res.data &&
        Array.isArray(res.data.data) &&
        res.data.data.length > 0
      ) {
        const latest = res.data.data[0];
        const created = (latest.created_at as string | undefined) || '';
        const createdDate = created.split('T')[0];
        const today = new Date().toISOString().split('T')[0];
        if (createdDate === today) {
          setLatestWorkInstructionId(latest.id as number);
        } else {
          setLatestWorkInstructionId(null);
        }
      } else {
        setLatestWorkInstructionId(null);
      }
    };
    fetchLatest();
  }, [factoryId, getWorkInstructions]);

  const canPrint = useMemo(
    () => Boolean(factoryId && latestWorkInstructionId),
    [factoryId, latestWorkInstructionId]
  );

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <h3 className="Heading-3">오늘의 생산 일정</h3>
          <MiniBtn
            text="생산지시서 출력"
            textColor="text-dg"
            borderColor="border-lg"
            onClick={() => {
              setIsPrintOverlayOpen(true);
            }}
            hoverColor="hover:bg-bg"
            disabled={!canPrint}
          />
        </div>
        <ProductionTable
          todayProductionPlans={todayProductionPlans}
          isLoading={isLoading}
        />
      </div>

      {/* overlay */}
      {isPrintOverlayOpen && (
        <OverlayView onClose={() => setIsPrintOverlayOpen(false)}>
          <div className="w-full flex flex-col p-8">
            <div className="flex justify-between items-center h-13 pb-3 border-b border-lg">
              <h3 className="Heading-3">생산지시서</h3>
              <button
                className="w-10 h-10 flex justify-center items-center cursor-pointer hover:bg-bg rounded-[8px] transition-colors ease-in-out duration-200"
                onClick={() => setIsPrintOverlayOpen(false)}
              >
                <X size={20} className="text-sv" />
              </button>
            </div>

            <div className="sticky top-0 bg-wh mb-6">
              <div className="py-6 w-full flex justify-between border-b border-lg">
                <div>
                  <h2 className="Heading-2">생산지시서를 출력하시겠어요?</h2>
                  <div className="mt-2.5 Me_Body-3 text-gr">
                    출력 전, 생산지시서 내용을 한 번 더 확인해 주세요.
                  </div>
                </div>
                <MiniBtn
                  text="생산지시서 출력"
                  textColor="text-wh"
                  bgColor="bg-primary"
                  hoverColor="hover:bg-primary-hover"
                  borderColor="border-primary-hover"
                  onClick={async () => {
                    // 출력 직전에 메모를 저장
                    if (latestWorkInstructionId) {
                      await updateWorkInstruction(latestWorkInstructionId, {
                        memo: currentMemo,
                      });
                    }
                    reactToPrintFn();
                  }}
                />
              </div>
            </div>

            <div ref={contentRef}>
              {latestWorkInstructionId && (
                <ProductionDocumentView
                  workInstructioId={latestWorkInstructionId}
                  onMemoChange={setCurrentMemo}
                />
              )}
            </div>
          </div>
        </OverlayView>
      )}
    </>
  );
};

export default TodayProductionSchedule;
