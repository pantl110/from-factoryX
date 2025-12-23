import NoHistoryBox from '@/ui/no-history-box';
import { UnitConversionModel } from '@/types/data-model';
import Pagination from '@/components/pagination';
import Spinner from '@/ui/spinner';
import SearchSection from './search-section';
import { UnitTableHeader } from './unit-table-header';
import { UnitTableItem } from './unit-table-item';
import { useState, useCallback, useMemo } from 'react';
import DeleteModal from '@/ui/modal/delete-modal';
import {
  useDeleteUnitConversionMutation,
  useCheckAll,
  useUnitConversionApi,
} from '@/hooks';
import { AddUnitModal } from './modals/add-unit-modal';

interface UnitProps {
  unitList: UnitConversionModel[];
  refetchUnit: () => Promise<void>;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  searchKeyword: string;
  onSearchChange: (value: string) => void;
  onSearchEnter: () => void;
  isLoading?: boolean;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}
const Unit = ({
  unitList,
  refetchUnit,
  currentPage,
  totalPages,
  onPageChange,
  searchKeyword,
  onSearchChange,
  onSearchEnter,
  isLoading = false,
  selectedCategory = '전체',
  onCategoryChange,
}: UnitProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteMutation = useDeleteUnitConversionMutation();

  // 테이블 아이템 클릭 시 열릴 단위변환 모달 상태
  const [isUnitModalOpenFromRow, setIsUnitModalOpenFromRow] = useState(false);
  const [selectedUnitForModal, setSelectedUnitForModal] =
    useState<UnitConversionModel | null>(null);

  // 단위변환 상세 조회 훅 (특정 품목 기준)
  const { getByMaterial, getByProduct } = useUnitConversionApi();

  // unitList의 id 배열
  const unitIds = useMemo(() => unitList.map((item) => item.id), [unitList]);

  // useCheckAll hook 사용
  const {
    checkedIds,
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(unitIds);

  // 선택된 항목들 삭제
  const handleBulkDelete = useCallback(async () => {
    if (checkedIds.length === 0) return;

    try {
      // 순차적으로 삭제 (동시 삭제 시 충돌 방지)
      for (const id of checkedIds) {
        await deleteMutation.mutateAsync(id);
      }
      setAllChecked(false);
      setIsDeleteModalOpen(false);
      await refetchUnit();
    } catch {
      // noop - error state is handled in hook consumer or toast layer
    }
  }, [checkedIds, deleteMutation, refetchUnit, setAllChecked]);

  // 행 클릭 시: id(자재/제품 기준)가 있으면 해당 품목에 대한 단위변환 조회 훅으로 최신 값 채우기
  const handleRowClick = useCallback(
    async (unit: UnitConversionModel) => {
      let detail: UnitConversionModel | null = null;
      try {
        if (unit.material) {
          const res = await getByMaterial(unit.material);
          if (res.success && res.data && res.data.length > 0) {
            // 특정 원자재에 대한 단위변환 목록 중 첫 번째 레코드 사용
            detail = res.data[0];
          }
        } else if (unit.product) {
          const res = await getByProduct(unit.product);
          if (res.success && res.data && res.data.length > 0) {
            // 특정 품목에 대한 단위변환 목록 중 첫 번째 레코드 사용
            detail = res.data[0];
          }
        }
      } catch {
        // 조회 실패 시에는 리스트에서 넘어온 값으로만 사용
      }

      setSelectedUnitForModal(detail || unit);
      setIsUnitModalOpenFromRow(true);
    },
    [getByMaterial, getByProduct]
  );

  return (
    <>
      <div className="w-full px-10 pb-10">
        <SearchSection
          value={searchKeyword}
          onChange={onSearchChange}
          onEnter={onSearchEnter}
          onDeleteClick={() => setIsDeleteModalOpen(true)}
          hasSelectedItems={checkedCount > 0}
          deleteButtonText={getDeleteButtonText()}
        />
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner />
          </div>
        ) : unitList.length === 0 ? (
          <NoHistoryBox
            title="단위가 아직 없어요."
            text="단위를 추가하면 이곳에 표시돼요."
          />
        ) : (
          <>
            <UnitTableHeader
              selectedCategory={selectedCategory}
              onCategoryChange={onCategoryChange}
              isAllSelected={isAllChecked}
              onToggleSelectAll={toggleAll}
            />
            {unitList.map((item: UnitConversionModel) => (
              <UnitTableItem
                key={item.id}
                unit={item}
                refetchUnit={refetchUnit}
                isSelected={isChecked(item.id)}
                onToggleSelect={() => toggleOne(item.id)}
                onRowClick={handleRowClick}
              />
            ))}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
              />
            )}
          </>
        )}
      </div>

      {/* 단위 삭제 모달 */}
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleBulkDelete}
          isLoading={deleteMutation.isPending}
        />
      )}

      {/* 테이블 아이템 클릭으로 여는 단위 변환 모달 */}
      {isUnitModalOpenFromRow && selectedUnitForModal && (
        <AddUnitModal
          onClose={() => setIsUnitModalOpenFromRow(false)}
          addUnitType={
            selectedUnitForModal.material !== null ? 'material' : 'product'
          }
          refetchUnit={refetchUnit}
          initialUnit={selectedUnitForModal}
        />
      )}
    </>
  );
};

export default Unit;
