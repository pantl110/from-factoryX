import { ProjectStatusType } from '@/types/status-type';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface ProductionLogTableHeaderProps {
  projectStatus: ProjectStatusType;
}

const ProductionLogTableHeader = ({
  projectStatus,
}: ProductionLogTableHeaderProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <div className="flex items-center h-12 min-w-[1559px] Me_Body-1 text-sv rounded bg-lg-table cursor-default">
      {/* //  sticky top-[113px] */}
      <p className="flex-[2] px-3">제품명</p>
      <p className="flex-1 px-3">제품코드</p>
      <p className="flex-1 px-3">규격</p>
      <p className="w-[80px] px-3">단위</p>
      <p className="flex-1 px-3">주문 수량</p>
      <p className="flex-1 px-3">생산 수량</p>
      <p className="flex-1 px-3">생산 설비</p>
      <p className="w-[200px] px-3">생산 일자</p>
      <p className="w-[140px] px-3">단위당 소요 시간</p>
      <p className="w-[150px] px-3">자재 상태</p>
      <p className="w-[200px] px-3">마감일자</p>
      {projectStatus === 'manufactured' && !isViewer && hasSubscription() && (
        <p className="w-[200px] px-3">액션</p>
      )}
    </div>
  );
};

export default ProductionLogTableHeader;
