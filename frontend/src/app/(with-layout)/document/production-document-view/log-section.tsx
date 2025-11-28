import { WorkInstructionHistoryResponseModel } from '@/types/data-model';
import {
  useWorkInstructionHistoryQuery,
  convertUTCToLocalTime,
  convertUTCToLocalDate,
} from '@/hooks';
import NoHistoryBox from '@/ui/no-history-box';
import MemoLogItem from './memo-log-item';
import { RoundChip } from '@/ui';

interface LogSectionProps {
  workInstructionId: number;
}

export const LogSection = ({ workInstructionId }: LogSectionProps) => {
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
        title="변경 이력이 없어요."
        text="생산지시서가 변경되면 이곳에 기록이 표시돼요."
      />
    );
  }

  // 액션 타입을 한글로 변환
  const getActionText = (action: string) => {
    switch (action) {
      case 'added':
        return '생산 계획 추가';
      case 'updated':
        return '수정';
      case 'removed':
        return '생산 계획 삭제';
      case 'memo_updated':
        return '메모 수정';
      default:
        return action;
    }
  };

  // item에 따라 RoundChip 색상 결정
  const getChipColor = (item: string) => {
    if (item === '생산 계획 추가') return 'secondary';
    if (item === '생산 계획 삭제') return 'red';
    if (item === '생산 설비') return 'gray';
    if (item === '생산 수량') return 'whiteOutline';
    if (item === '생산 일자') return 'purple';
    if (item === '마감 예정일자') return 'orange';
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
        changes.push('생산 설비');
      }
    }

    // 생산 수량 변경
    if (before.quantity !== undefined && after.quantity !== undefined) {
      if (before.quantity !== after.quantity) {
        changes.push('생산 수량');
      }
    }

    // 생산 일자 변경 (start_date) - 변환된 값이 다를 때만 표시
    if (
      before.start_date !== undefined &&
      after.start_date !== undefined &&
      before.start_date !== after.start_date
    ) {
      const beforeDate = convertUTCToLocalDate(before.start_date);
      const beforeTime = convertUTCToLocalTime(before.start_date);
      const afterDate = convertUTCToLocalDate(after.start_date);
      const afterTime = convertUTCToLocalTime(after.start_date);

      // 변환된 날짜와 시간이 모두 다를 때만 추가
      if (beforeDate !== afterDate || beforeTime !== afterTime) {
        changes.push('생산 일자');
      }
    }

    // 마감 예정일자 변경 (end_date) - 변환된 값이 다를 때만 표시
    if (
      before.end_date !== undefined &&
      after.end_date !== undefined &&
      before.end_date !== after.end_date
    ) {
      const beforeDate = convertUTCToLocalDate(before.end_date);
      const beforeTime = convertUTCToLocalTime(before.end_date);
      const afterDate = convertUTCToLocalDate(after.end_date);
      const afterTime = convertUTCToLocalTime(after.end_date);

      // 변환된 날짜와 시간이 모두 다를 때만 추가
      if (beforeDate !== afterDate || beforeTime !== afterTime) {
        changes.push('마감 예정일자');
      }
    }

    // 상태 변경
    if (before.status !== undefined && after.status !== undefined) {
      if (before.status !== after.status) {
        changes.push('상태');
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

    if (item === '생산 설비') {
      // equipment_name이 있으면 사용, 없으면 plan에서 가져오기
      return (
        before.equipment_name ||
        history.plan?.equipment_name ||
        `설비 ID: ${before.equipment_id}` ||
        '-'
      );
    }
    if (item === '생산 수량') {
      return before.quantity?.toString() || '-';
    }
    if (item === '생산 일자') {
      if (!before.start_date) return '-';
      const date = convertUTCToLocalDate(before.start_date);
      const time = convertUTCToLocalTime(before.start_date);
      return `${date}\n${time}`;
    }
    if (item === '마감 예정일자') {
      if (!before.end_date) return '-';
      const date = convertUTCToLocalDate(before.end_date);
      const time = convertUTCToLocalTime(before.end_date);
      return `${date}\n${time}`;
    }
    if (item === '상태') {
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

    if (item === '생산 설비') {
      // equipment_name이 있으면 사용, 없으면 plan에서 가져오기
      return (
        after.equipment_name ||
        history.plan?.equipment_name ||
        `설비 ID: ${after.equipment_id}` ||
        '-'
      );
    }
    if (item === '생산 수량') {
      return after.quantity?.toString() || '-';
    }
    if (item === '생산 일자') {
      if (!after.start_date) return '-';
      const date = convertUTCToLocalDate(after.start_date);
      const time = convertUTCToLocalTime(after.start_date);
      return `${date}\n${time}`;
    }
    if (item === '마감 예정일자') {
      if (!after.end_date) return '-';
      const date = convertUTCToLocalDate(after.end_date);
      const time = convertUTCToLocalTime(after.end_date);
      return `${date}\n${time}`;
    }
    if (item === '상태') {
      return after.status || '-';
    }

    return '-';
  };

  return (
    <>
      {/* 수정 로그 */}
      <div className="flex flex-col">
        <h3 className="Heading-3 mb-3 h-10 flex items-center">
          생산계획 수정로그
        </h3>

        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
          <p className="flex-[0.5] px-3 text-sv">수정일시</p>
          <p className="flex-[1.2] px-3 text-sv">프로젝트명</p>
          <p className="flex-[1.2] px-3 text-sv">제품명</p>
          <p className="flex-1 px-3 text-sv">변경항목</p>
          <p className="flex-1 px-3 text-sv">변경 전</p>
          <p className="flex-1 px-3 text-sv">변경 후</p>
          <p className="flex-[0.8] px-3 text-sv">담당자</p>
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
                  {index === 0 ? convertUTCToLocalDate(history.created_at) : ''}
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
          <h3 className="Heading-3 h-10 flex items-center">메모 수정로그</h3>
          {historyData
            .filter((history) => history.action === 'memo_updated')
            .map((history) => {
              // memo_updated일 때 after_data에 memo 필드가 있음
              const afterData = history.after_data as {
                memo?: string | null;
              } | null;
              const memo = afterData?.memo ?? null;
              const time = convertUTCToLocalDate(history.created_at);
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
