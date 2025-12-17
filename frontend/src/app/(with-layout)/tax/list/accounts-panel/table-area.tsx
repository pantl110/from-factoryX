import { MiniBtn } from '@/ui';
import Table from './table';

interface TableAreaProps {
  isPurchase: boolean;
}

const TableArea = ({ isPurchase }: TableAreaProps) => {
  const title = isPurchase ? '지급 상세 내역' : '회수 상세 내역';
  const inputButtonText = isPurchase
    ? '지급 정보 입력하기'
    : '입금 정보 입력하기';

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <h3 className="Heading-3 h-10 flex items-center">{title}</h3>

        {/* 버튼 */}
        <div className="flex gap-2">
          {!isPurchase && <MiniBtn text="메일 보내기" variant="whiteOutline" />}
          <MiniBtn text={inputButtonText} variant="whiteOutline" />
        </div>
      </div>

      {/* 표 */}
      <Table isPurchase={isPurchase} />
    </div>
  );
};

export default TableArea;
