'use client';

import { useEffect } from 'react';
import NoHistoryBox from '@/ui/no-history-box';
import { useProductHistory, useTooltip } from '@/hooks';
import { ProductHistoryListResponseModel } from '@/types/data-model';
import ProductStockLog from './product-stock-log';
import { Info } from '@phosphor-icons/react';
import Tooltip from '@/ui/tooltip';
import { useTranslations } from 'next-intl';

interface ProductHistoryProps {
  productId: number | null;
  setIsProjectStockHistoryModalOpen: (modal: {
    isOpen: boolean;
    projectId?: number;
  }) => void;
}

const PAGE_SIZE = 8;

const ProductHistory = ({
  productId,
  setIsProjectStockHistoryModalOpen,
}: ProductHistoryProps) => {
  // const [isProductStockLogDropdownOpen, setIsProductStockLogDropdownOpen] =
  //   useState(false); // 판넬의 제품 입·출고 내역 드롭다운

  const t = useTranslations('stock.product.productHistory');
  const { listProductHistories, data, isLoading } = useProductHistory();
  const { isVisible, onMouseEnter, onMouseLeave } = useTooltip({});

  const listData = data as ProductHistoryListResponseModel | undefined;
  const page = listData?.curPage ?? 1;
  const totalPages = listData?.pageCnt ?? 1;
  const histories = listData?.data ?? [];

  // 페이지 변경 핸들러
  const handlePageChange = (newPage: number) => {
    if (newPage !== page && productId !== null) {
      // const filters = periodSelector.createFilters(
      //   periodSelector.selectedPeriod,
      //   newPage
      // );
      // listProductHistories(filters);

      listProductHistories({
        product_id: productId,
        page: newPage,
        page_size: PAGE_SIZE,
      });
    }
  };

  // 초기 로드 및 제품 변경 시 첫 페이지 조회
  useEffect(() => {
    if (productId !== null) {
      listProductHistories({
        product_id: productId,
        page: 1,
        page_size: PAGE_SIZE,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="h-10 flex items-center gap-2">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            {t('title')}
          </h3>
          <div
            className="relative"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <Info size={20} className="text-gr cursor-help" />
            {isVisible && (
              <div className="absolute z-10 top-7 -left-2 w-140">
                <Tooltip text={t('tooltip')} color="black" position="left" />
              </div>
            )}
          </div>
        </div>

        {/* 재고 이력 목록 */}
        {isLoading ? (
          <div className="h-50" />
        ) : productId === null || histories.length === 0 ? (
          <NoHistoryBox title={t('empty.title')} text={t('empty.text')} />
        ) : (
          <ProductStockLog
            data={histories}
            page={page}
            totalPages={totalPages}
            setPage={handlePageChange}
            setIsProjectStockHistoryModalOpen={
              setIsProjectStockHistoryModalOpen
            }
          />
        )}
      </div>
    </>
  );
};

export default ProductHistory;
