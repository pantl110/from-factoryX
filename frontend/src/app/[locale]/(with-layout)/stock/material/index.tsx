'use client';

import TableHeader from './table-header';
import TableItem from './table-item';
import SearchInput from '@/ui/search-input';
import MiniBtn from '@/ui/mini-btn';
import DeleteModal from '@/ui/modal/delete-modal';
import { useState, useEffect } from 'react';
import {
  useDeleteMaterial,
  useCheckAll,
  useGetMaterial,
  useUpdateMaterial,
} from '@/hooks';
import Spinner from '@/ui/spinner';
import { useMaterialReloadStore } from '@/store/material-reload-store';
import Pagination from '@/components/pagination';
import MaterialDetailPanel from './material-detail';
import { MaterialResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface MaterialProps {
  setIsMaterialDetailOpen: (v: boolean) => void;
  isMaterialDetailOpen: boolean;
  setReloadFunctionToParent?: (setter: () => void) => void;
}

const Material = ({
  setIsMaterialDetailOpen,
  isMaterialDetailOpen,
  setReloadFunctionToParent,
}: MaterialProps) => {
  const t = useTranslations('stock.material');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    null
  ); // 선택한 자재 정보를 판넬에서 보여주기

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [taxTypeFilter, setTaxTypeFilter] = useState<'' | 'taxable' | 'exempt'>(
    ''
  );
  const [bulkTaxType, setBulkTaxType] = useState<'taxable' | 'exempt'>(
    'taxable'
  );
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [order, setOrder] = useState<'asc' | 'desc'>('desc');
  const pageSize = 10;

  const { getMaterialList, materialList, pagination, isLoading } =
    useGetMaterial();
  const { shouldReload, setShouldReload } = useMaterialReloadStore();
  const { deleteMaterial, isLoading: isDeleting } = useDeleteMaterial();
  const { updateMaterial } = useUpdateMaterial();

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

  // 페이지 유효성 관리 (삭제나 비어 있는 페이지 처리)
  useEffect(() => {
    const totalPages = pagination?.pageCnt || 0;
    const hasData = materialList.length > 0;

    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
      getMaterialList({
        order,
        q: search,
        tax_type: taxTypeFilter || undefined,
        page: totalPages,
        page_size: pageSize,
      });
      return;
    }

    if (!isLoading && page > 1 && !hasData) {
      const previousPage = page - 1;
      setPage(previousPage);
      getMaterialList({
        order,
        q: search,
        tax_type: taxTypeFilter || undefined,
        page: previousPage,
        page_size: pageSize,
      });
    }
  }, [
    pagination?.pageCnt,
    materialList.length,
    page,
    isLoading,
    order,
    search,
    taxTypeFilter,
    pageSize,
    getMaterialList,
  ]);

  const handleDelete = async () => {
    // 체크된 자재 id 목록
    const idsToDelete = materialList
      .filter((m: MaterialResponseModel) => isChecked(m.id))
      .map((m: MaterialResponseModel) => m.id);
    for (const id of idsToDelete) {
      await deleteMaterial(id);
    }
    setIsDeleteModalOpen(false);
    getMaterialList({
      order,
      q: search,
      tax_type: taxTypeFilter || undefined,
      page,
      page_size: pageSize,
    }); // 삭제 후 목록 새로고침
    setAllChecked(false); // 체크 해제
  };

  // 마운트 시 데이터 불러오기
  useEffect(() => {
    getMaterialList({
      order,
      q: search,
      tax_type: taxTypeFilter || undefined,
      page,
      page_size: pageSize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, order, taxTypeFilter]);

  // Pass reload function to parent
  useEffect(() => {
    if (setReloadFunctionToParent) {
      setReloadFunctionToParent(() => {
        // Reset search and go to first page
        setSearch('');
        setTaxTypeFilter('');
        setPage(1);
        setOrder('desc');
        getMaterialList({
          order: 'desc',
          q: undefined,
          page: 1,
          page_size: pageSize,
        });
      });
    }
  }, [setReloadFunctionToParent, getMaterialList, pageSize]);

  // shouldReload가 true일 때 목록 새로고침
  useEffect(() => {
    if (shouldReload) {
      getMaterialList({
        order,
        q: search,
        tax_type: taxTypeFilter || undefined,
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
    taxTypeFilter,
  ]);

  // 검색 핸들러
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // 검색 시 첫 페이지로 이동
    getMaterialList({
      order,
      q: value,
      tax_type: taxTypeFilter || undefined,
      page: 1,
      page_size: pageSize,
    });
  };

  const handleTaxTypeFilter = (value: '' | 'taxable' | 'exempt') => {
    setTaxTypeFilter(value);
    setPage(1);
    setAllChecked(false);
    setBulkMessage(null);
  };

  const handleBulkTaxTypeUpdate = async () => {
    const checkedIds = materialList
      .filter((material: MaterialResponseModel) => isChecked(material.id))
      .map((material: MaterialResponseModel) => material.id);
    if (checkedIds.length === 0) return;

    setIsBulkUpdating(true);
    setBulkMessage(null);
    let failedCount = 0;
    for (const id of checkedIds) {
      const result = await updateMaterial(id, { tax_type: bulkTaxType });
      if (!result.success) failedCount += 1;
    }

    if (failedCount === 0) {
      setBulkMessage({
        type: 'success',
        text: t('taxManagement.bulkSuccess', { count: checkedIds.length }),
      });
      setAllChecked(false);
    } else {
      setBulkMessage({
        type: 'error',
        text: t('taxManagement.bulkFailed', { count: failedCount }),
      });
    }
    await getMaterialList({
      order,
      q: search,
      tax_type: taxTypeFilter || undefined,
      page,
      page_size: pageSize,
    });
    setIsBulkUpdating(false);
  };

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            placeholder={t('searchPlaceholder')}
            value={search}
            onChange={handleSearch}
          />
          <select
            aria-label={t('taxManagement.filterLabel')}
            className="h-10 rounded-md border border-lg bg-wh px-3 Me_Body-3 text-dg"
            value={taxTypeFilter}
            onChange={(event) =>
              handleTaxTypeFilter(
                event.target.value as '' | 'taxable' | 'exempt'
              )
            }
          >
            <option value="">{t('taxManagement.all')}</option>
            <option value="taxable">{t('taxManagement.taxable')}</option>
            <option value="exempt">{t('taxManagement.exempt')}</option>
          </select>
        </div>
        {materialList.length > 0 && !isViewer && hasSubscription() && (
          <div className="flex flex-wrap items-center gap-1">
            {checkedCount > 0 && (
              <>
                <select
                  aria-label={t('taxManagement.bulkLabel')}
                  className="h-10 rounded-md border border-lg bg-wh px-3 Me_Body-3 text-dg"
                  value={bulkTaxType}
                  onChange={(event) =>
                    setBulkTaxType(event.target.value as 'taxable' | 'exempt')
                  }
                >
                  <option value="taxable">
                    {t('taxManagement.changeToTaxable')}
                  </option>
                  <option value="exempt">
                    {t('taxManagement.changeToExempt')}
                  </option>
                </select>
                <MiniBtn
                  variant="primary"
                  text={t('taxManagement.applySelected', {
                    count: checkedCount,
                  })}
                  disabled={isBulkUpdating}
                  onClick={handleBulkTaxTypeUpdate}
                />
              </>
            )}
            {/* <MiniBtn
              text="취소"
              variant="outline"
              onClick={() => setAllChecked(false)}
            /> */}
            <MiniBtn
              text={getDeleteButtonText()}
              variant={checkedCount > 0 ? 'red' : 'outline'}
              onClick={
                checkedCount > 0 ? () => setIsDeleteModalOpen(true) : () => {}
              }
            />
          </div>
        )}
      </div>

      {bulkMessage && (
        <p
          aria-live="polite"
          className={`mb-3 text-sm ${
            bulkMessage.type === 'success' ? 'text-green' : 'text-red'
          }`}
        >
          {bulkMessage.text}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center h-100">
          <Spinner />
        </div>
      ) : materialList.length === 0 ? (
        <NoHistoryBox title={t('empty.title')} text={t('empty.description')} />
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
