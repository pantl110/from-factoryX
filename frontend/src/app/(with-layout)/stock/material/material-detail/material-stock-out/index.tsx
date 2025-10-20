import { MaterialStockOutItem } from './material-stock-out-item';

export const MaterialStockOut = () => {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">원자재 사용 내역</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
          <p className="flex-1 px-3 text-sv">처리일자</p>
          <p className="flex-1 px-3 text-sv">생산지시서</p>
          <p className="flex-1 px-3 text-sv">제품명</p>
          <p className="flex-1 px-3 text-sv">적용 LOT</p>
          <p className="flex-1 px-3 text-sv">주자재 사용량</p>
        </div>

        <MaterialStockOutItem />
        <MaterialStockOutItem />
        <MaterialStockOutItem />

        {/* 페이지네이션 필요 */}
      </div>
    </div>
  );
};
