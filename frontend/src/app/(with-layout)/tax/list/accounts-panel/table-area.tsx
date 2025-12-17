import { MiniBtn } from '@/ui';
import Table from './table';
import AccountInfo from './account-info';

const TableArea = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">매출채권 테이블</h3>

      {/* 거래처의 정보 */}
      <AccountInfo />

      {/* 버튼 */}
      <div className="flex justify-end gap-2">
        <MiniBtn text="메일 보내기" variant="whiteOutline" />
        <MiniBtn text="입금 정보 입력하기" variant="whiteOutline" />
      </div>

      {/* 표 */}
      <Table />
    </div>
  );
};

export default TableArea;
