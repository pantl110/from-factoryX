import { UsageHistoryItem } from './usage-history-item';

export const UsageHistory = () => {
  return (
    <div className="mt-5 flex flex-col gap-3">
      <h4 className="Heading-4">소분된 원자재 사용 내역</h4>
      <div>
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
          <p className="flex-1 px-3 text-sv">처리일자</p>
          <p className="flex-1 px-3 text-sv">생산지시서</p>
          <p className="flex-1 px-3 text-sv">제품명</p>
          <p className="flex-1 px-3 text-sv">자재 사용량</p>
        </div>

        <UsageHistoryItem />
        <UsageHistoryItem />
        <UsageHistoryItem />

        {/* 페이지네이션 */}
      </div>
    </div>
  );
};
