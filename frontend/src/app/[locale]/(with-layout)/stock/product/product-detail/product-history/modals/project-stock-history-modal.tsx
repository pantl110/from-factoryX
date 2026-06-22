import { useEffect, useState } from 'react';
import Modal from '@/ui/modal/modal';
import { useProductHistory } from '@/hooks';
import { ProductHistoryListResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Pagination from '@/components/pagination';
import MiniBtn from '@/ui/mini-btn';
import { formatISODate } from '@/utils';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations(
    'stock.product.productHistory.projectStockHistoryModal'
  );
  const tStock = useTranslations('stock');
  const tCommon = useTranslations('common');
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
        is_canceled: true,
      });
    }
  }, [projectId, productId, currentPage, listProductHistories]);

  return (
    <Modal
      onClose={onClose}
      title={t('title')}
      subtitle={histories.length > 0 ? histories[0].client_name : ''}
      scroll={true}
    >
      {isLoading ? (
        <div className="h-30"></div>
      ) : (
        <div className="mt-4 mx-4">
          {histories.length > 0 ? (
            <>
              <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3">
                <p className="flex-1 py-1 px-3 text-sv">
                  {t('tableHeader.processDate')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tStock('productionQuantity')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tStock('deliveryQuantity')}
                </p>
                <p className="flex-1 py-1 px-3 text-sv">
                  {tCommon('currentStock')}
                </p>
              </div>

              <div className="overflow-y-auto max-h-[calc(85vh-220px)] scrollbar-hide pb-4">
                {histories.map((history) => (
                  <div
                    className="flex items-center h-14 border-b border-lg Me_Body-3"
                    key={history.id}
                  >
                    <p className="flex-1 px-3 text-dg">
                      {formatISODate(history.created_at)}
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
                  <MiniBtn
                    text={tCommon('close')}
                    variant="white"
                    onClick={onClose}
                  />
                </div>
              </div>
            </>
          ) : (
            <>
              <NoHistoryBox text={t('empty.text')} height="h-25" />
              <div className="flex justify-end mt-4 mb-4">
                <MiniBtn
                  text={tCommon('close')}
                  variant="white"
                  onClick={onClose}
                />
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  );
};

export default ProjectStockHistoryModal;
