import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MiniBtn from '@/ui/mini-btn';
import LogItem from './log-item';
import ReturnSection from './return';
import NoSelectedLog from './no-selected-log';
import MemoSection from './memo';
import PlanChangeSection from './plan-change';
import CreateMemoModal from './modals/create-memo-modal';
import EmptyLog from './empty-log';
import {
  ProjectLogListResponseModel,
  ProjectLogResponseModel,
} from '@/types/data-model';
import { useGetProjectLogs } from '@/hooks';
import Spinner from '@/ui/spinner';
import { ProjectStatusType } from '@/types/status-type';

interface ProductionMonitorProps {
  projectStatus: ProjectStatusType;
}

const ProductionMonitor = ({ projectStatus }: ProductionMonitorProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  const [selectedLog, setSelectedLog] =
    useState<ProjectLogResponseModel | null>(null);
  const [isCreateMemoModalOpen, setIsCreateMemoModalOpen] = useState(false);

  const { getProjectLogs, isLoading } = useGetProjectLogs();
  const [logData, setLogData] = useState<ProjectLogListResponseModel>({
    data: [],
    count: 0,
    totalCnt: 0,
    pageCnt: 0,
    curPage: 0,
    nextPage: null,
    previousPage: null,
  });

  // 프로젝트 로그 데이터 가져오기
  const loadProjectLogs = async () => {
    if (!projectId) return;

    const result = await getProjectLogs(projectId);
    if (result.success && result.data) {
      setLogData(result.data);
    }
  };

  useEffect(() => {
    loadProjectLogs();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <>
      {isLoading ? (
        <div className="flex justify-center items-center h-100">
          <Spinner />
        </div>
      ) : (
        <div className="mx-10">
          <div
            className="flex gap-3 w-full overflow-y-hidden"
            style={{ height: 'calc(100vh - 263px)' }}
          >
            {/* 왼쪽 영역 */}
            <div className={`w-[50%] h-full flex flex-col gap-4 flex-1 pt-5`}>
              <div className="flex flex-col gap-4 h-full min-h-0">
                {projectStatus !== '프로젝트 완료' && (
                  <div>
                    <MiniBtn
                      text="메모 작성"
                      textColor="text-dg"
                      borderColor="border-lg"
                      onClick={() => setIsCreateMemoModalOpen(true)}
                      hoverColor="hover:bg-bg"
                    />
                  </div>
                )}

                {logData.data.length === 0 ? (
                  <EmptyLog />
                ) : (
                  <div className="flex flex-col gap-4 flex-1 h-full min-h-0 overflow-y-auto scrollbar-hide pb-10">
                    {logData.data.map((log) => {
                      return (
                        <LogItem
                          key={log.id}
                          log={log}
                          onClick={() => setSelectedLog(log)}
                          isSelected={selectedLog?.id === log.id}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {logData.data.length > 0 && (
              <div className="w-1 border-r border-lg" />
            )}

            {/* 오른쪽 영역: 선택된 로그에 따라 렌더링 */}
            {logData.data.length > 0 && (
              <div className="w-[50%] flex-1 pt-5 pb-10">
                {selectedLog ? (
                  selectedLog.type === '메모' ? (
                    <MemoSection
                      key={selectedLog.id} // 강제 리렌더링을 위한 key
                      logId={selectedLog.id}
                      title={selectedLog.title}
                      content={selectedLog.content}
                      onUpdate={loadProjectLogs}
                      projectStatus={projectStatus}
                    />
                  ) : selectedLog.type === '반품' ? (
                    <ReturnSection
                      key={selectedLog.id}
                      refundId={selectedLog.refund_id || 3}
                    />
                  ) : selectedLog.type === '계획 변경' ? (
                    <PlanChangeSection
                      key={selectedLog.id}
                      title={selectedLog.title}
                      content={selectedLog.content}
                    />
                  ) : null
                ) : (
                  <NoSelectedLog />
                )}
              </div>
            )}

            {/* 모달 */}
            {isCreateMemoModalOpen && (
              <CreateMemoModal
                onClose={() => setIsCreateMemoModalOpen(false)}
                onSuccess={loadProjectLogs}
              />
            )}
            {/* {isDeleteMemoModalOpen && (
          <DeleteMemoModal onClose={() => setIsDeleteMemoModalOpen(false)} />
        )} */}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductionMonitor;
