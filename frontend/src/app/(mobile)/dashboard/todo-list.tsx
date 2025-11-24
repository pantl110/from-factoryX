import { CaretRight } from '@phosphor-icons/react';
// import SalesStatus from './sales-status';
import TodoListItem from './todo-list-item';
import MoBtn from '@/ui/mo-btn';
import { useRouter } from 'next/navigation';
import { MobileDashboardCountsResponseModel } from '@/types/data-model';

interface TodoListProps {
  data: MobileDashboardCountsResponseModel;
}

const TodoList = ({ data }: TodoListProps) => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-2.5">
      {/* 정산 현황 */}
      {/* <SalesStatus /> */}

      {/* 할일 리스트 */}
      {/* <div className="flex gap-2.5"> */}
      <TodoListItem
        title="납기 도래"
        count={data.undelivered_quotation_products}
        onClick={() => {
          router.push('/alarm?tab=due-date');
        }}
      />
      <TodoListItem
        title="ROP"
        count={data.shortage_materials}
        onClick={() => {
          router.push('/alarm?tab=rop');
        }}
      />
      {/* </div> */}
      {/* <div className="flex gap-2.5"> */}
      <TodoListItem
        title="확정 필요 주문"
        count={data.stale_confirmed_projects}
        onClick={() => {
          router.push('/alarm?tab=confirmation-required');
        }}
      />
      <TodoListItem
        title="유통기한"
        count={data.expiry_risk_materials}
        onClick={() => {
          router.push('/alarm?tab=expiry');
        }}
      />
      {/* </div> */}

      {/* 버튼 */}
      <MoBtn
        text="알림 더 보기"
        variant="outline"
        icon={<CaretRight />}
        width="w-full"
        onClick={() => {
          router.push('/alarm?tab=all');
        }}
      />
    </div>
  );
};

export default TodoList;
