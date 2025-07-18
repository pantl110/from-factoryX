'use client';

import { useState } from 'react';
import MainTitleSec from './main-title-sec';
import SearchDeleteTable from '@/ui/search-delete-table';
import { projectData } from '@/mocks/project-data';
import { ProjectStatusType } from '@/types/status-type';
import TableHeader from './table-header';
import TableItem from './table-item';
import SelectModal from './modals/select-modal';
import ExcelUploadModal from './modals/excel-upload-modal';
import { useSearchParams, useRouter } from 'next/navigation';
import Pagination from '@/components/pagination';
import usePagination from '@/hooks/use-pagination';
import { ClientDataModel } from '@/types/data-model';
import { useCheckAll } from '@/hooks/use-check-all';
import DeleteModal from '@/ui/modal/delete-modal';

const ProcessProjectPageInner = () => {
  const router = useRouter();
  // dashboard 페이지에서 접근 시 견적 협의 탭으로 이동
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  // 탭 상태
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatusType | '전체'
  >(
    tab === 'quote' ? '견적 협의' : tab === 'inProduction' ? '생산 중' : '전체'
  );
  // 모달 상태
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<'startDate' | 'endDate'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredProjects =
    selectedStatus === '전체'
      ? projectData
      : projectData.filter((project) => project.status === selectedStatus);

  // 정렬 적용
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // 페이지네이션에 정렬된 데이터 사용
  const {
    currentItems: currentProjects,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({
    items: sortedProjects,
    itemsPerPage: 10,
  });

  const currentIds = currentProjects.map((project) => project.id);
  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(currentIds);

  const handleNewQuotation = () => {
    setIsSelectModalOpen(true);
  };
  const handleOpenUploadModal = () => {
    setIsSelectModalOpen(false);
    setIsUploadModalOpen(true);
  };
  const handleStatusChange = (status: ProjectStatusType | '전체') => {
    setSelectedStatus(status);
    setCurrentPage(1); // 상태 변경 시 표는 첫 페이지로 이동
  };

  const handleDirectInputClick = (clientData?: ClientDataModel) => {
    if (clientData) {
      // clientData가 있으면 URL 파라미터로 전달
      const params = new URLSearchParams();
      params.set('clientData', JSON.stringify(clientData));
      router.push(`/quotation?${params.toString()}`);
    } else {
      // clientData가 없으면 빈 값으로 이동
      router.push('/quotation');
    }
  };

  // 정렬 핸들러
  const handleSort = (key: 'startDate' | 'endDate') => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          onNewQuotation={handleNewQuotation}
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
        />
        <div className="px-10 pb-10">
          <SearchDeleteTable
            placeholder="업체명이나 품목명을 검색하세요."
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCancel={() => setAllChecked(false)}
          />
          <div className="overflow-y-auto w-full">
            <TableHeader
              isAllChecked={isAllChecked}
              onToggleAll={toggleAll}
              onSort={handleSort}
            />
            {currentProjects.map((project) => (
              <TableItem
                key={project.id}
                id={project.id}
                status={project.status}
                companyName={project.companyName}
                items={project.items}
                startDate={project.startDate}
                endDate={project.endDate}
                taxIssued={project.taxIssued}
                checked={isChecked(project.id)}
                onToggle={() => toggleOne(project.id)}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>

      {/* 모달 */}
      {isSelectModalOpen && (
        <SelectModal
          onClose={() => setIsSelectModalOpen(false)}
          onUploadClick={handleOpenUploadModal}
          onDirectInputClick={handleDirectInputClick}
        />
      )}
      {isUploadModalOpen && (
        <ExcelUploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onComplete={handleDirectInputClick}
        />
      )}
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={() => setIsDeleteModalOpen(false)}
        />
      )}
    </>
  );
};

export default ProcessProjectPageInner;
