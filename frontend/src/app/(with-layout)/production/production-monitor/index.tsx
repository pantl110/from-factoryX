import { useState } from 'react'
import MiniBtn from '@/ui/mini-btn'
import LogItem from './log-item'
import ReturnSection from './return'
import { logData, LogDataModel } from '@/mocks/log-data'
import NoSelectedLog from './no-selected-log'
import MemoSection from './memo'
import PlanChangeSection from './plan-change'
import DeleteMemoModal from './modals/delete-memo-modal'
import CreateMemoModal from './modals/create-memo-modal'
import EmptyLog from './empty-log'

const ProductionMonitor = () => {
  const [selectedLog, setSelectedLog] = useState<LogDataModel | null>(null)
  const [isCreateMemoModalOpen, setIsCreateMemoModalOpen] = useState(false)
  const [isDeleteMemoModalOpen, setIsDeleteMemoModalOpen] = useState(false)

  return (
    <div
      className="flex gap-3 px-10 w-full overflow-y-hidden"
      style={{ height: 'calc(100vh - 253px)' }}
    >
      {/* 왼쪽 영역 */}
      <div className={`w-[50%] flex flex-col gap-4 flex-1 pt-5`}>
        <div className="flex flex-col gap-4 h-full min-h-0">
          <div>
            <MiniBtn
              text="메모 작성"
              textColor="text-dg"
              borderColor="border-lg"
              onClick={() => setIsCreateMemoModalOpen(true)}
              hoverColor="hover:bg-bg"
            />
          </div>

          {logData.length === 0 ? (
            <EmptyLog />
          ) : (
            <div className="flex flex-col gap-4 flex-1 pb-10 h-full min-h-0 overflow-y-auto scrollbar-hide">
              {logData.map((log) => (
                <LogItem
                  key={log.id}
                  type={log.type}
                  title={log.title}
                  content={log.content}
                  createdAt={log.createdAt}
                  onClick={() => setSelectedLog(log)}
                  isSelected={selectedLog?.id === log.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {logData.length === 0 ? null : <div className="w-1 border-r border-lg" />}

      {/* 오른쪽 영역: 선택된 로그에 따라 렌더링 */}
      <div className="w-[50%] flex-1 pt-5">
        {selectedLog ? (
          selectedLog.type === 'memo' ? (
            <MemoSection
              title={selectedLog.title}
              content={selectedLog.content}
              setIsDeleteModalOpen={setIsDeleteMemoModalOpen}
            />
          ) : selectedLog.type === 'return' ? (
            <ReturnSection />
          ) : selectedLog.type === 'planChange' ? (
            <PlanChangeSection title={selectedLog.title} content={selectedLog.content} />
          ) : null
        ) : (
          <NoSelectedLog />
        )}

        {/* 모달 */}
        {isCreateMemoModalOpen && (
          <CreateMemoModal onClose={() => setIsCreateMemoModalOpen(false)} />
        )}
        {isDeleteMemoModalOpen && (
          <DeleteMemoModal onClose={() => setIsDeleteMemoModalOpen(false)} />
        )}
      </div>
    </div>
  )
}

export default ProductionMonitor
