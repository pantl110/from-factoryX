'use client';

import { useTranslations } from 'next-intl';
import { WorkInstructionHistoryResponseModel } from '@/types/data-model';
import { useWorkInstructionHistoryQuery } from '@/hooks';
import { formatISODate, formatISODateTime } from '@/utils';
import NoHistoryBox from '@/ui/no-history-box';
import MemoLogItem from './memo-log-item';
import { RoundChip } from '@/ui';

interface LogSectionProps {
  workInstructionId: number;
}

export const LogSection = ({ workInstructionId }: LogSectionProps) => {
  const t = useTranslations('document');
  const tCommon = useTranslations('common');
  const {
    data: historyData = [],
    isLoading,
    error,
  } = useWorkInstructionHistoryQuery(workInstructionId);

  // 로딩 중 또는 에러 발생
  if (isLoading || error) {
    return <></>;
  }

  // 히스토리 데이터가 없을 때
  if (historyData.length === 0) {
    return (
      <NoHistoryBox
        title={t('noChangeHistory')}
        text={t('noChangeHistoryDescription')}
      />
    );
  }

  // 액션 타입을 번역 키로 변환
  const getActionText = (action: string) => {
    switch (action) {
      case 'added':
        return t('actionAdded');
      case 'updated':
        return tCommon('edit');
      case 'removed':
        return t('actionRemoved');
      case 'memo_updated':
        return t('actionMemoUpdated');
      default:
        return action;
    }
  };

  // item에 따라 RoundChip 색상 결정
  const getChipColor = (item: string) => {
    if (item === t('actionAdded')) return 'secondary';
    if (item === t('actionRemoved')) return 'red';
    if (item === tCommon('productionEquipment')) return 'gray';
    if (item === tCommon('productionQuantity')) return 'whiteOutline';
    if (item === tCommon('productionDate')) return 'purple';
    if (item === tCommon('expectedCompletionDate')) return 'orange';
    if (item === tCommon('status')) return 'gray';
    return 'gray';
  };

  // 프로젝트명 표시
  const getProjectName = (history: WorkInstructionHistoryResponseModel) => {
    return history.plan?.client_name || '-';
  };

  // 제품명 표시
  const getProductName = (history: WorkInstructionHistoryResponseModel) => {
    return history.plan?.product_name || '-';
  };

  // 변경된 항목 목록 반환
  const getChangedItemsList = (
    history: WorkInstructionHistoryResponseModel
  ): string[] => {
    if (history.action === 'added' || history.action === 'removed') {
      return [getActionText(history.action)];
    }

    const changes: string[] = [];
    const before = history.before_data || {};
    const after = history.after_data || {};

    // 생산 설비 변경
    if (before.equipment_id !== undefined && after.equipment_id !== undefined) {
      if (before.equipment_id !== after.equipment_id) {
        changes.push(tCommon('productionEquipment'));
      }
    }

    // 생산 수량 변경
    if (before.quantity !== undefined && after.quantity !== undefined) {
      if (before.quantity !== after.quantity) {
        changes.push(tCommon('productionQuantity'));
      }
    }

    // 생산 일자 변경 (start_date) - 변환된 값이 다를 때만 표시
    if (
      before.start_date !== undefined &&
      after.start_date !== undefined &&
      before.start_date !== after.start_date
    ) {
      const beforeDateTime = formatISODateTime(before.start_date);
      const afterDateTime = formatISODateTime(after.start_date);
      const beforeTime = beforeDateTime ? beforeDateTime.split(' ')[1] : '';
      const afterTime = afterDateTime ? afterDateTime.split(' ')[1] : '';

      // 변환된 시간이 다를 때만 추가
      if (beforeTime !== afterTime) {
        changes.push(tCommon('productionDate'));
      }
    }

    // 마감 예정일자 변경 (end_date) - 변환된 값이 다를 때만 표시
    if (
      before.end_date !== undefined &&
      after.end_date !== undefined &&
      before.end_date !== after.end_date
    ) {
      const beforeDateTime = formatISODateTime(before.end_date);
      const afterDateTime = formatISODateTime(after.end_date);
      const beforeTime = beforeDateTime ? beforeDateTime.split(' ')[1] : '';
      const afterTime = afterDateTime ? afterDateTime.split(' ')[1] : '';

      // 변환된 시간이 다를 때만 추가
      if (beforeTime !== afterTime) {
        changes.push(tCommon('expectedCompletionDate'));
      }
    }

    // 상태 변경
    if (before.status !== undefined && after.status !== undefined) {
      if (before.status !== after.status) {
        changes.push(tCommon('status'));
      }
    }

    return changes.length > 0 ? changes : ['-'];
  };

  // 특정 변경 항목의 변경 전 값 표시
  const getBeforeValueForItem = (
    history: WorkInstructionHistoryResponseModel,
    item: string
  ): string => {
    if (history.action === 'added') {
      return '-';
    }

    const before = history.before_data || {};

    if (item === tCommon('productionEquipment')) {
      // equipment_name이 있으면 사용, 없으면 plan에서 가져오기
      if (before.equipment_name) {
        return before.equipment_name;
      }
      if (history.plan?.equipment_name) {
        return history.plan.equipment_name;
      }
      return '-';
    }
    if (item === tCommon('productionQuantity')) {
      return before.quantity?.toString() || '-';
    }
    if (item === tCommon('productionDate')) {
      if (!before.start_date) return '-';
      const date = formatISODate(before.start_date);
      const dateTime = formatISODateTime(before.start_date);
      const time = dateTime ? dateTime.split(' ')[1] : '';
      return `${date}\n${time}`;
    }
    if (item === tCommon('expectedCompletionDate')) {
      if (!before.end_date) return '-';
      const date = formatISODate(before.end_date);
      const dateTime = formatISODateTime(before.end_date);
      const time = dateTime ? dateTime.split(' ')[1] : '';
      return `${date}\n${time}`;
    }
    if (item === tCommon('status')) {
      return before.status || '-';
    }

    return '-';
  };

  // 특정 변경 항목의 변경 후 값 표시
  const getAfterValueForItem = (
    history: WorkInstructionHistoryResponseModel,
    item: string
  ): string => {
    if (history.action === 'removed') {
      return '-';
    }

    const after = history.after_data || {};

    if (item === tCommon('productionEquipment')) {
      // equipment_name이 있으면 사용, 없으면 plan에서 가져오기
      if (after.equipment_name) {
        return after.equipment_name;
      }
      if (history.plan?.equipment_name) {
        return history.plan.equipment_name;
      }
      return '-';
    }
    if (item === tCommon('productionQuantity')) {
      return after.quantity?.toString() || '-';
    }
    if (item === tCommon('productionDate')) {
      if (!after.start_date) return '-';
      const date = formatISODate(after.start_date);
      const dateTime = formatISODateTime(after.start_date);
      const time = dateTime ? dateTime.split(' ')[1] : '';
      return `${date}\n${time}`;
    }
    if (item === tCommon('expectedCompletionDate')) {
      if (!after.end_date) return '-';
      const date = formatISODate(after.end_date);
      const dateTime = formatISODateTime(after.end_date);
      const time = dateTime ? dateTime.split(' ')[1] : '';
      return `${date}\n${time}`;
    }
    if (item === tCommon('status')) {
      return after.status || '-';
    }

    return '-';
  };

  return (
    <>
      {/* 수정 로그 */}
      <div className="flex flex-col">
        <h3 className="Heading-3 mb-3 h-10 flex items-center">
          {t('productionPlanEditLog')}
        </h3>

        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="flex-[0.5] px-3 text-sv">{t('editDateTime')}</p>
          <p className="flex-[1.2] px-3 text-sv">{tCommon('clientName')}</p>
          <p className="flex-[1.2] px-3 text-sv">{tCommon('productName')}</p>
          <p className="flex-1 px-3 text-sv">{t('changedItem')}</p>
          <p className="flex-1 px-3 text-sv">{t('beforeChange')}</p>
          <p className="flex-1 px-3 text-sv">{t('afterChange')}</p>
          <p className="flex-[0.8] px-3 text-sv">{t('responsiblePerson')}</p>
        </div>

        {historyData
          .filter((history) => history.action !== 'memo_updated')
          .flatMap((history) => {
            const changedItems = getChangedItemsList(history);
            return changedItems.map((item, index) => (
              <div
                key={`${history.id}-${item}-${index}`}
                className="flex items-start border-b border-lg Me_Body-1 cursor-default"
              >
                <p className="flex-[0.5] px-3 py-[15px] text-dg">
                  {index === 0
                    ? (() => {
                        const dateTime = formatISODateTime(history.created_at);
                        return dateTime ? dateTime.split(' ')[1] : '';
                      })()
                    : ''}
                </p>
                <p
                  className="flex-[1.2] px-3 py-[15px] text-dg truncate"
                  title={index === 0 ? getProjectName(history) : ''}
                >
                  {index === 0 ? getProjectName(history) : ''}
                </p>
                <p
                  className="flex-[1.2] px-3 py-[15px] text-dg truncate"
                  title={index === 0 ? getProductName(history) : ''}
                >
                  {index === 0 ? getProductName(history) : ''}
                </p>
                <div className="flex-1 px-2 py-[15px] text-dg">
                  <RoundChip
                    text={item}
                    variant="sm"
                    color={getChipColor(item)}
                  />
                </div>
                <p
                  className="flex-1 px-3 py-[15px] text-dg whitespace-pre-line truncate"
                  title={
                    history.action === 'added' || history.action === 'removed'
                      ? ''
                      : getBeforeValueForItem(history, item)
                  }
                >
                  {history.action === 'added' || history.action === 'removed'
                    ? ''
                    : getBeforeValueForItem(history, item)}
                </p>
                <p
                  className="flex-1 px-3 py-[15px] text-dg whitespace-pre-line truncate"
                  title={
                    history.action === 'added' || history.action === 'removed'
                      ? ''
                      : getAfterValueForItem(history, item)
                  }
                >
                  {history.action === 'added' || history.action === 'removed'
                    ? ''
                    : getAfterValueForItem(history, item)}
                </p>
                <p
                  className="flex-[0.8] px-3 py-[15px] text-dg truncate"
                  title={
                    index === 0
                      ? history.changed_by?.username ||
                        history.changed_by?.email ||
                        '-'
                      : ''
                  }
                >
                  {index === 0
                    ? history.changed_by?.username ||
                      history.changed_by?.email ||
                      '-'
                    : ''}
                </p>
              </div>
            ));
          })}
      </div>

      {/* 메모 로그 */}
      {historyData.filter((history) => history.action === 'memo_updated')
        .length > 0 && (
        <div className="flex flex-col">
          <h3 className="Heading-3 h-10 flex items-center">
            {t('memoEditLog')}
          </h3>
          {historyData
            .filter((history) => history.action === 'memo_updated')
            .map((history) => {
              // memo_updated일 때 after_data에 memo 필드가 있음
              const afterData = history.after_data as {
                memo?: string | null;
              } | null;
              const memo = afterData?.memo ?? null;
              const time = formatISODateTime(history.created_at);
              const changedBy = history.changed_by
                ? {
                    role: history.changed_by.role || null,
                    username: history.changed_by.username || null,
                    email: history.changed_by.email,
                  }
                : null;

              return (
                <MemoLogItem
                  key={history.id}
                  memo={memo}
                  time={time}
                  changedBy={changedBy}
                />
              );
            })}
        </div>
      )}
    </>
  );
};
