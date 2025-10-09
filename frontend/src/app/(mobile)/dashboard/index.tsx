import { Calendar, Note } from '@phosphor-icons/react';
import TopBar from './topbar';
import WorkList from './work-list';
import TodoList from './todo-list';
import Memo from './memo';

const MobileDashboardPage = () => {
  return (
    <>
      <TopBar />
      <div className="flex flex-col gap-8 py-6 px-4">
        {/* 작업목록 */}
        <WorkList />

        {/* 오늘의 할일 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-primary-8 rounded-full ">
              <Calendar size={20} className="text-primary" />
            </div>
            <h4 className="m-Heading-4b">오늘의 할일</h4>
          </div>
          <TodoList />
        </div>

        {/* 메모 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-1.5 items-center">
            <div className="w-8 h-8 flex items-center justify-center bg-primary-8 rounded-full ">
              <Note size={20} className="text-primary" />
            </div>
            <h4 className="m-Heading-4b">메모</h4>
          </div>
          <Memo />
        </div>
      </div>
    </>
  );
};

export default MobileDashboardPage;
