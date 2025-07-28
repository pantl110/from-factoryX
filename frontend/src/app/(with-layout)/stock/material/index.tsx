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

interface MaterialProps {
  setIsMaterialDetailOpen: (v: boolean) => void;
  isMaterialDetailOpen: boolean;
}

const Material = ({
  setIsMaterialDetailOpen,
  isMaterialDetailOpen,
}: MaterialProps) => {
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    null
  ); // 선택한 자재 정보를 판넬에서 보여주기

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { getMaterialList, materialList, isLoading, error, pagination } =
    useGetMaterial();
  const { shouldReload, setShouldReload } = useMaterialReloadStore();

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(materialList.map((m) => m.id));

  const { deleteMaterial, isLoading: isDeleting } = useDeleteMaterial();

  const handleDelete = async () => {
    // 체크된 자재 id 목록
    const idsToDelete = materialList
      .filter((m) => isChecked(m.id))
      .map((m) => m.id);
    for (const id of idsToDelete) {
      await deleteMaterial(id);
    }
    setIsDeleteModalOpen(false);
    getMaterialList(); // 삭제 후 목록 새로고침
    setAllChecked(false); // 체크 해제
  };

  // 마운트 시 데이터 불러오기
  useEffect(() => {
    getMaterialList({ order: 'desc', page, page_size: pageSize });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // shouldReload가 true일 때 목록 새로고침
  useEffect(() => {
    if (shouldReload) {
      getMaterialList({ order: 'desc', q: search, page, page_size: pageSize });
      setShouldReload(false);
    }
  }, [shouldReload, getMaterialList, setShouldReload, search, page, pageSize]);

  // 검색 핸들러
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // 검색 시 첫 페이지로 이동
    getMaterialList({ order: 'desc', q: value, page: 1, page_size: pageSize });
  };

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput
          placeholder="자재명 또는 자재코드를 검색하세요."
          value={search}
          onChange={handleSearch}
        />
        <div className="flex gap-1">
          <MiniBtn
            text="취소"
            textColor="text-dg"
            borderColor="border-lg"
            bgColor="bg-white"
            hoverColor="hover:bg-bg"
            onClick={() => setAllChecked(false)}
          />
          <MiniBtn
            text={getDeleteButtonText()}
            textColor={checkedCount > 0 ? 'text-red' : 'text-dg'}
            borderColor={checkedCount > 0 ? 'border-none' : 'border-lg'}
            bgColor={checkedCount > 0 ? 'bg-red-8' : 'bg-wh'}
            hoverColor={checkedCount > 0 ? 'hover:bg-red-hover' : 'hover:bg-bg'}
            onClick={
              checkedCount > 0 ? () => setIsDeleteModalOpen(true) : () => {}
            }
          />
        </div>
      </div>

      {isLoading || error ? (
        <div className="flex justify-center items-center h-100">
          <Spinner />
        </div>
      ) : (
        <div>
          <TableHeader isAllChecked={isAllChecked} onToggleAll={toggleAll} />
          {materialList.map((material) => {
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
          {pagination && pagination.pageCnt > 1 && (
            <Pagination
              currentPage={pagination.curPage}
              totalPages={pagination.pageCnt}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      {isDeleteModalOpen && (
        <DeleteModal onClose={handleDelete} isLoading={isDeleting} />
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
