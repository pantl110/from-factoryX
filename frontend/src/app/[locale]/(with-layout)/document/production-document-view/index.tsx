'use client';

import { useTranslations } from 'next-intl';
import DocumentViewTitle from '../document-view-title';
import { useEffect, useState } from 'react';
import { useGetWorkInstruction } from '@/hooks';
import { formatISODate } from '@/utils';
import {
  WorkInstructionDetailPlanModel,
  WorkInstructionDetailResponseModel,
} from '@/types/data-model';
import Chip from '@/ui/chip';
import { DocumentSection } from './document-section';
import { LogSection } from './log-section';

// 프로젝트명별로 그룹핑 함수
const groupByProject = (data: WorkInstructionDetailPlanModel[]) => {
  return data.reduce<Record<string, WorkInstructionDetailPlanModel[]>>(
    (acc, item) => {
      if (!acc[item.client_name]) acc[item.client_name] = [];
      acc[item.client_name].push(item);
      return acc;
    },
    {} as Record<string, WorkInstructionDetailPlanModel[]>
  );
};

interface ProductionDocumentViewProps {
  workInstructioId: number;
  isOnlyRead?: boolean;
  onMemoChange?: (memo: string) => void;
}

const ProductionDocumentView = ({
  workInstructioId,
  isOnlyRead = false,
  onMemoChange,
}: ProductionDocumentViewProps) => {
  const t = useTranslations('document');
  const [workInstruction, setWorkInstruction] =
    useState<WorkInstructionDetailResponseModel | null>(null);
  const [value, setValue] = useState('');
  const [selectedChip, setSelectedChip] = useState<'document' | 'log'>(
    'document'
  );

  const { getWorkInstruction } = useGetWorkInstruction();
  useEffect(() => {
    if (workInstructioId) {
      getWorkInstruction(workInstructioId).then((res) => {
        if (res.success && res.data) {
          setWorkInstruction(res.data);
          const initialMemo = res.data.memo || '';
          setValue(initialMemo);
          if (onMemoChange) onMemoChange(initialMemo);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workInstructioId, getWorkInstruction]);

  // 데이터가 로드되기 전에는 빈 화면 표시
  if (!workInstruction) {
    return null;
  }

  // plan_info가 있으면 그것을 사용, 없으면 plans 사용
  const plansData =
    workInstruction.plan_info && workInstruction.plan_info.length > 0
      ? workInstruction.plan_info
      : workInstruction.plans;

  const grouped = groupByProject(plansData);

  const formattedDate = formatISODate(workInstruction?.created_at || '') || '';
  const documentTitle = t('productionDocumentTitleFormat', {
    date: formattedDate,
    workInstruction: t('workInstruction'),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1">
        <Chip
          text={t('workInstruction')}
          radius="rounded-full"
          bgColor={selectedChip === 'document' ? 'bg-dg' : 'bg-transparent'}
          textColor={selectedChip === 'document' ? 'text-wh' : 'text-dg'}
          borderColor="border-lg"
          padding="px-4"
          height="h-9"
          cursor="cursor-pointer transition-all duration-200 ease-in-out"
          onClick={() => setSelectedChip('document')}
        />
        <Chip
          text={t('editLog')}
          radius="rounded-full"
          bgColor={selectedChip === 'log' ? 'bg-dg' : 'bg-transparent'}
          textColor={selectedChip === 'log' ? 'text-wh' : 'text-dg'}
          borderColor="border-lg"
          padding="px-4"
          height="h-9"
          cursor="cursor-pointer transition-all duration-200 ease-in-out"
          onClick={() => setSelectedChip('log')}
        />
      </div>
      <DocumentViewTitle title={documentTitle} />

      {selectedChip === 'document' ? (
        <DocumentSection
          grouped={grouped}
          plansData={plansData}
          isOnlyRead={isOnlyRead}
          value={value}
          setValue={setValue}
          onMemoChange={onMemoChange}
        />
      ) : (
        <LogSection workInstructionId={workInstructioId} />
      )}
    </div>
  );
};

export default ProductionDocumentView;
