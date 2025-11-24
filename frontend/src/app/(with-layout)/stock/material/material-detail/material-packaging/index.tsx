import { useState } from 'react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useGetMaterialRepackagings } from '@/hooks';
import { MaterialPackagingItem } from './material-packaging-item';
import { NoHistoryBox } from '@/ui';
import Pagination from '@/components/pagination';

interface MaterialPackagingProps {
  materialId: number;
  setIsMaterialPackagingDetailModalOpen: (repackagingId: number) => void;
  handleOpenDeleteModal: (repackagingId: number) => void;
}

export const MaterialPackaging = ({
  materialId,
  setIsMaterialPackagingDetailModalOpen,
  handleOpenDeleteModal,
}: MaterialPackagingProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const [page, setPage] = useState(1);
  const pageSize = 5;

  const { data: repackagingsData, isLoading } = useGetMaterialRepackagings(
    materialId,
    {
      page,
      page_size: pageSize,
    }
  );

  const repackagings = repackagingsData?.data || [];
  const totalPages = repackagingsData?.pageCnt || 1;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">원자재 소분 내역</h3>
      </div>

      {/* 표 헤더 부분 */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="h-50" />
        ) : repackagings && repackagings.length > 0 ? (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
              {/* <p className="flex-[0.8] px-3 text-sv">상태</p> */}
              <p className="flex-[1.5] px-3 text-sv">부모 LOT 번호</p>
              <p className="flex-[1.5] px-3 text-sv">소분 LOT 번호</p>
              <p className="flex-1 px-3 text-sv">수량</p>
              <p className="flex-1 px-3 text-sv">창고 위치</p>
              <p className="flex-1 px-3 text-sv">유통기한</p>
              {!isViewer && hasSubscription() && (
                <p className="flex-1 px-3 text-sv">액션</p>
              )}
            </div>
            {repackagings.map((repackaging) => (
              <MaterialPackagingItem
                key={repackaging.id}
                repackaging={repackaging}
                setIsMaterialPackagingDetailModalOpen={
                  setIsMaterialPackagingDetailModalOpen
                }
                onDelete={() => handleOpenDeleteModal(repackaging.id)}
              />
            ))}
            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        ) : (
          <NoHistoryBox
            title="아직 소분된 원자재가 없어요."
            text="대표 원자재를 소분하면 이곳에서 확인할 수 있어요."
          />
        )}
      </div>
    </div>
  );
};
