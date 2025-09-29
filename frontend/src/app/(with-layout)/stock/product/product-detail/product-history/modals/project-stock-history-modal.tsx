import { useEffect, useState } from 'react';
import Modal from '@/ui/modal/modal';
import { useProductHistory } from '@/hooks';
import { ProductHistoryListResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Pagination from '@/components/pagination';
import MiniBtn from '@/ui/mini-btn';

interface ProjectStockHistoryModalProps {
  projectId?: number;
  productId?: number;
  onClose: () => void;
}

const ProjectStockHistoryModal = ({
  projectId,
  productId,
  onClose,
}: ProjectStockHistoryModalProps) => {
  const { listProductHistories, data, isLoading } = useProductHistory();
  const [currentPage, setCurrentPage] = useState(1);

  const listData = data as ProductHistoryListResponseModel | undefined;
  const histories = listData?.data ?? [];
  const totalPages = listData?.pageCnt ?? 1;

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && projectId) {
      setCurrentPage(newPage);
    }
  };

  // 프로젝트별 히스토리 데이터 조회
  useEffect(() => {
    if (projectId) {
      listProductHistories({
        project_id: projectId,
        product_id: productId,
        page: currentPage,
        page_size: 8,
        // is cancelled true로 가져오기
      });
    }
  }, [projectId, productId, currentPage, listProductHistories]);

  return (
    <Modal
      onClose={onClose}
      title="재고 변동 내역"
      subtitle={histories.length > 0 ? histories[0].client_name : ''}
      scroll={true}
    >
      {isLoading ? (
        <div className="h-30"></div>
      ) : (
        <div className="mt-4 mx-4">
          {histories.length > 0 ? (
            <>
              <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
                <p className="flex-1 py-1 px-3 text-sv">처리일자</p>
                <p className="flex-1 py-1 px-3 text-sv">생산 수량</p>
                <p className="flex-1 py-1 px-3 text-sv">납품 수량</p>
                <p className="flex-1 py-1 px-3 text-sv">현재 재고</p>
              </div>

              <div className="overflow-y-auto max-h-[calc(85vh-220px)] scrollbar-hide pb-4">
                {histories.map((history) => (
                  <div
                    className="flex items-center h-14 border-b border-lg Me_Body-1"
                    key={history.id}
                  >
                    <p className="flex-1 px-3 text-dg">
                      {history.created_at.split('T')[0]}
                    </p>
                    <p className="flex-1 px-3 text-primary">
                      {history.production_quantity
                        ? '+' + history.production_quantity.toLocaleString()
                        : '-'}
                    </p>
                    <p className="flex-1 px-3 text-red">
                      {history.delivery_quantity
                        ? '-' + history.delivery_quantity.toLocaleString()
                        : '-'}
                    </p>
                    <p className="flex-1 px-3 text-dg">
                      {history.total_stock
                        ? history.total_stock.toLocaleString()
                        : '-'}
                    </p>
                  </div>
                ))}
                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
                <div className="flex justify-end mt-4">
                  <MiniBtn text="닫기" variant="primary" onClick={onClose} />
                </div>
              </div>
            </>
          ) : (
            <NoHistoryBox
              title="수정된 재고 내역이 아직 없어요."
              text="재고 내역이 수정되면 이곳에서 확인할 수 있어요."
            />
          )}
        </div>
      )}
    </Modal>
  );
};

export default ProjectStockHistoryModal;
