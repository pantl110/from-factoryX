import { MaterialHistoryResponseModel } from '@/types/data-model';
import Checkbox from '@/ui/checkbox';
import UnlinkedTableItem from './unlinked-table-item';
import { useCallback, useRef, useEffect } from 'react';

interface UnlinkedTableProps {
  unlinkedMaterialHistory: MaterialHistoryResponseModel[];
  selectedIds?: number[];
  onToggleSelectAll?: () => void;
  onToggleSelect?: (id: number) => void;
  onLoadMore?: () => void;
}

const UnlinkedTable = ({
  unlinkedMaterialHistory,
  selectedIds = [],
  onToggleSelectAll,
  onToggleSelect,
  onLoadMore,
}: UnlinkedTableProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  // onLoadMore 함수가 변경될 때마다 ref 업데이트
  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el || !onLoadMoreRef.current) return;

    const { scrollTop, clientHeight, scrollHeight } = el;

    // 하단에 닿았는지 확인
    const isAtBottom = scrollTop + clientHeight >= scrollHeight;

    if (isAtBottom) {
      onLoadMoreRef.current();
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('scroll', onScroll);
    return () => {
      container.removeEventListener('scroll', onScroll);
    };
  }, [onScroll]);

  return (
    <div ref={containerRef} className="h-[496px] overflow-y-auto">
      <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
        <Checkbox
          isChecked={
            selectedIds.length === unlinkedMaterialHistory.length &&
            unlinkedMaterialHistory.length > 0
          }
          onToggle={onToggleSelectAll || (() => {})}
        />
        <p className="flex-[1.5] px-3 text-sv">자재명</p>
        <p className="flex-1 px-3 text-sv">규격</p>
        <p className="flex-[0.7] px-3 text-sv">수량</p>
        <p className="flex-[0.5] px-3 text-sv">단위</p>
        <p className="flex-[0.7] px-3 text-sv">단가</p>
        <p className="flex-1 px-3 text-sv">금액</p>
      </div>
      {unlinkedMaterialHistory.map((item) => (
        <UnlinkedTableItem
          key={item.id}
          item={item}
          isChecked={selectedIds.includes(item.id)}
          onToggle={() => onToggleSelect && onToggleSelect(item.id)}
        />
      ))}
    </div>
  );
};

export default UnlinkedTable;
