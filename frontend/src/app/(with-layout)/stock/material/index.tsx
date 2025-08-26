'use client';

import TableHeader from './table-header';
import TableItem from './table-item';
import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import DeleteModal from '@/ui/modal/delete-modal';
import { useState, useEffect } from 'react';
import { useDeleteMaterial, useCheckAll, useGetMaterial } from '@/hooks';
import Spinner from '@/ui/spinner';
import { useMaterialReloadStore } from '@/store/material-reload-store';
import Pagination from '@/components/pagination';
import MaterialDetailPanel from './material-detail';
import { MaterialResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import useMemberStore from '@/store/member-store';

interface MaterialProps {
  setIsMaterialDetailOpen: (v: boolean) => void;
  isMaterialDetailOpen: boolean;
}

const Material = ({
  setIsMaterialDetailOpen,
  isMaterialDetailOpen,
}: MaterialProps) => {
  const role = useMemberStore((state) => state.role);

  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    null
  ); // 선택한 자재 정보를 판넬에서 보여주기

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 10;

  const { getMaterialList, materialList, pagination, isLoading } =
    useGetMaterial();
  const { shouldReload, setShouldReload } = useMaterialReloadStore();
  const { deleteMaterial, isLoading: isDeleting } = useDeleteMaterial();

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(materialList.map((m: MaterialResponseModel) => m.id));

  // 정렬 핸들러
  const handleSortChange = (newOrder: 'asc' | 'desc') => {
    setOrder(newOrder);
    setPage(1); // 정렬 변경 시 첫 페이지로 이동
  };

  const handleDelete = async () => {
    // 체크된 자재 id 목록
    const idsToDelete = materialList
      .filter((m: MaterialResponseModel) => isChecked(m.id))
      .map((m: MaterialResponseModel) => m.id);
    for (const id of idsToDelete) {
      await deleteMaterial(id);
    }
    setIsDeleteModalOpen(false);
    getMaterialList(); // 삭제 후 목록 새로고침
    setAllChecked(false); // 체크 해제
  };

  // 마운트 시 데이터 불러오기
  useEffect(() => {
    getMaterialList({ order, page, page_size: pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, order]);

  // shouldReload가 true일 때 목록 새로고침
  useEffect(() => {
    if (shouldReload) {
      getMaterialList({
        order,
        q: search,
        page,
        page_size: pageSize,
      });
      setShouldReload(false);
    }
  }, [
    shouldReload,
    getMaterialList,
    setShouldReload,
    search,
    page,
    pageSize,
    order,
  ]);

  // 검색 핸들러
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // 검색 시 첫 페이지로 이동
    getMaterialList({
      order,
      q: value,
      page: 1,
      page_size: pageSize,
    });
  };

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput
          placeholder="자재명 또는 자재코드를 검색하세요."
          value={search}
          onChange={handleSearch}
        />
        {materialList.length > 0 && (
          <div className="flex gap-1">
            <MiniBtn
              text="취소"
              textColor="text-dg"
              borderColor="border-lg"
              bgColor="bg-white"
              hoverColor="hover:bg-bg"
              onClick={() => setAllChecked(false)}
              disabled={role === 'viewer'}
            />
            <MiniBtn
              text={getDeleteButtonText()}
              textColor={checkedCount > 0 ? 'text-red' : 'text-dg'}
              borderColor={checkedCount > 0 ? 'border-none' : 'border-lg'}
              bgColor={checkedCount > 0 ? 'bg-red-8' : 'bg-wh'}
              hoverColor={
                checkedCount > 0 ? 'hover:bg-red-hover' : 'hover:bg-bg'
              }
              onClick={
                checkedCount > 0 ? () => setIsDeleteModalOpen(true) : () => {}
              }
              disabled={role === 'viewer'}
            />
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-100">
          <Spinner />
        </div>
      ) : materialList.length === 0 ? (
        <NoHistoryBox
          title="자재가 아직 없어요."
          text="자재가 생성되면 이곳에 표시돼요. "
        />
      ) : (
        <>
          <TableHeader
            isAllChecked={isAllChecked}
            onToggleAll={toggleAll}
            currentOrder={order}
            onSortChange={handleSortChange}
          />
          {materialList.length > 0 &&
            materialList.map((material: MaterialResponseModel) => {
              return (
                <TableItem
                  key={material.id}
                  material={material}
                  onClick={() => {
                    setSelectedMaterialId(material.id);
                    setIsMaterialDetailOpen(true);
                  }}
                  checked={isChecked(material.id)}
                  onToggle={() => toggleOne(material.id)}
                />
              );
            })}

          {/* 페이지네이션 */}
          {pagination && pagination.pageCnt && pagination.pageCnt > 1 && (
            <Pagination
              currentPage={pagination.curPage || 1}
              totalPages={pagination.pageCnt}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      {isDeleteModalOpen && (
        <DeleteModal
          onDelete={handleDelete}
          isLoading={isDeleting}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}

      {/* 자재 디테일 판넬 */}
      {isMaterialDetailOpen && selectedMaterialId && (
        <MaterialDetailPanel
          setIsMaterialDetailOpen={setIsMaterialDetailOpen}
          selectedMaterialId={selectedMaterialId}
        />
      )}
    </>
  );
};

export default Material;
