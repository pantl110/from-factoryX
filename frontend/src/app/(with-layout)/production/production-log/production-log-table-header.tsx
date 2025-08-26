import { ProjectStatusType } from '@/types/status-type';

interface ProductionLogTableHeaderProps {
  projectStatus: ProjectStatusType;
}

const ProductionLogTableHeader = ({
  projectStatus,
}: ProductionLogTableHeaderProps) => {
  return (
    <div className="flex items-center h-12 min-w-[1559px] Me_Body-1 text-sv rounded bg-lg-table">
      {/* //  sticky top-[113px] */}
      <p className="flex-[2] px-3">품목명</p>
      <p className="flex-1 px-3">품목코드</p>
      <p className="flex-1 px-3">규격</p>
      <p className="w-[80px] px-3">단위</p>
      <p className="flex-1 px-3">주문 수량</p>
      <p className="flex-1 px-3">생산 수량</p>
      <p className="flex-1 px-3">생산 설비</p>
      <p className="w-[200px] px-3">생산 일자</p>
      <p className="w-[140px] px-3">단위당 소요 시간</p>
      <p className="w-[150px] px-3">자재 상태</p>
      <p className="w-[200px] px-3">마감일자</p>
      {projectStatus === 'manufactured' && <div className="w-[150px]" />}
    </div>
  );
};

export default ProductionLogTableHeader;
