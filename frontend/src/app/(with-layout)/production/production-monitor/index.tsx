import { useState, useEffect, useCallback } from 'react';
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
import { useGetProjectLogs, useInfiniteScroll } from '@/hooks';
import Spinner from '@/ui/spinner';
import { ProjectStatusType } from '@/types/status-type';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface ProductionMonitorProps {
  projectStatus: ProjectStatusType;
  onTabChange?: (tab: string) => void; // 탭 변경 콜백
}

const ProductionMonitor = ({
  projectStatus,
  onTabChange,
}: ProductionMonitorProps) => {
  const params = useParams();
  const projectId = params.id ? parseInt(params.id as string) : null;

  // role, 구독 확인
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

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
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // 프로젝트 로그 데이터 가져오기 (초기 로드)
  const loadProjectLogs = useCallback(
    async (page: number = 1, append: boolean = false) => {
      if (!projectId) return;

      // 추가 로드 시에만 isLoadingMore 체크
      if (append && isLoadingMore) return;

      if (append) {
        setIsLoadingMore(true);
      }

      const result = await getProjectLogs(projectId, { page, size: 20 });
      if (result.success && result.data) {
        if (append) {
          // 기존 데이터에 추가
          setLogData((prev) => ({
            ...result.data!,
            data: [...prev.data, ...result.data!.data],
          }));
        } else {
          // 새로 설정
          setLogData(result.data);
        }
      }

      if (append) {
        setIsLoadingMore(false);
      }
    },
    [projectId, getProjectLogs, isLoadingMore]
  );

  // 다음 페이지 로드
  const loadNextPage = useCallback(() => {
    if (logData.nextPage && !isLoadingMore && !isLoading) {
      loadProjectLogs(logData.nextPage, true);
    }
  }, [logData.nextPage, isLoadingMore, isLoading, loadProjectLogs]);

  // 무한스크롤 훅
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    enabled: true,
    hasMore: logData.nextPage !== null,
    isLoading: isLoading && logData.data.length === 0,
    isFetchingMore: isLoadingMore,
    onLoadMore: loadNextPage,
  });

  // 특정 로그만 업데이트 (데이터 재로딩 없이)
  const updateLogItem = (logId: number, title: string, content: string) => {
    setLogData((prev) => ({
      ...prev,
      data: prev.data.map((log) =>
        log.id === logId ? { ...log, title, content } : log
      ),
    }));
  };

  useEffect(() => {
    // 프로젝트가 변경되면 초기화하고 첫 페이지 로드
    setLogData({
      data: [],
      count: 0,
      totalCnt: 0,
      pageCnt: 0,
      curPage: 0,
      nextPage: null,
      previousPage: null,
    });
    loadProjectLogs(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <>
      {isLoading && logData.data.length === 0 ? (
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
                {projectStatus !== 'completed' && (
                  <div>
                    <MiniBtn
                      text="메모 작성하기"
                      textColor="text-dg"
                      borderColor="border-lg"
                      onClick={() => setIsCreateMemoModalOpen(true)}
                      hoverColor="hover:bg-bg"
                      disabled={isViewer || !hasSubscription()}
                    />
                  </div>
                )}

                {logData.data.length === 0 && !isLoading ? (
                  <EmptyLog />
                ) : (
                  <div className="flex flex-col gap-4 flex-1 h-full min-h-0 overflow-y-auto scrollbar-hide pb-10">
                    {logData.data.map((log, index) => {
                      const isLastItem = index === logData.data.length - 1;
                      return (
                        <div key={log.id} ref={isLastItem ? loadMoreRef : null}>
                          <LogItem
                            log={log}
                            onClick={() => setSelectedLog(log)}
                            isSelected={selectedLog?.id === log.id}
                          />
                        </div>
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
                  (() => {
                    // logData에서 최신 데이터 찾기
                    const currentLog = logData.data.find(
                      (log) => log.id === selectedLog.id
                    );
                    if (!currentLog) return <NoSelectedLog />;

                    return currentLog.type === 'memo' ? (
                      <MemoSection
                        key={currentLog.id} // logId만 사용하여 재마운트 방지
                        logId={currentLog.id}
                        title={currentLog.title}
                        content={currentLog.content}
                        onUpdate={(title, content) =>
                          updateLogItem(currentLog.id, title, content)
                        }
                        projectStatus={projectStatus}
                      />
                    ) : currentLog.type === 'refund' ? (
                      <ReturnSection
                        key={currentLog.id}
                        refundId={currentLog.refund?.id || 0}
                        logId={currentLog.id}
                        onTabChange={onTabChange}
                      />
                    ) : currentLog.type === 'plan' ||
                      currentLog.type === 'date' ? (
                      <PlanChangeSection
                        key={currentLog.id}
                        title={currentLog.title}
                        content={currentLog.content}
                      />
                    ) : null;
                  })()
                ) : (
                  <NoSelectedLog />
                )}
              </div>
            )}

            {/* 모달 */}
            {isCreateMemoModalOpen && (
              <CreateMemoModal
                onClose={() => setIsCreateMemoModalOpen(false)}
                onSuccess={() => {
                  // 메모 작성 후 첫 페이지부터 다시 로드
                  loadProjectLogs(1, false);
                }}
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
