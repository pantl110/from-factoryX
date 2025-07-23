'use client';

import { useState, useEffect, useCallback } from 'react';
import MainTitleSec from './main-title-sec';
import SearchDeleteTable from '@/ui/search-delete-table';
import { ProjectStatusType } from '@/types/status-type';
import TableHeader from './table-header';
import TableItem from './table-item';
import SelectModal from './modals/select-modal';
import ExcelUploadModal from './modals/excel-upload-modal';
import { useSearchParams, useRouter } from 'next/navigation';
import Pagination from '@/components/pagination';
import { ClientDataModel, ProjectListResponseModel } from '@/types/data-model';
import { useCheckAll } from '@/hooks/use-check-all';
import DeleteModal from '@/ui/modal/delete-modal';
import Spinner from '@/ui/spinner';
import useGetProjects from '@/hooks/project/use-get-projects';
import useFactoryStore from '@/store/factory-store';

const ProcessProjectPageInner = () => {
  const router = useRouter();
  const { getProjects, isLoading } = useGetProjects();
  const { factoryId } = useFactoryStore();

  // dashboard 페이지에서 접근 시 견적 협의 탭으로 이동
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');

  // 탭 상태
  const [selectedStatus, setSelectedStatus] = useState<
    ProjectStatusType | 'progress'
  >(
    tab === 'quote'
      ? 'quotation'
      : tab === 'inProduction'
        ? 'production'
        : 'progress'
  );

  // 모달 상태
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 데이터 상태
  const [projectData, setProjectData] =
    useState<ProjectListResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortKey, setSortKey] = useState<'startDate' | 'endDate'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 데이터 로드 함수
  const loadProjects = useCallback(
    async (
      page: number = 1,
      search: string = '',
      orderBy: 'start_date' | 'due_date' = 'start_date',
      orderDir: 'asc' | 'desc' = 'desc',
      size: number = 10
    ) => {
      if (!factoryId) return;

      const result = await getProjects({
        factory_id: factoryId,
        status: selectedStatus,
        search,
        order_by: orderBy,
        order_dir: orderDir,
        page,
        size,
      });

      if (result.success && result.data) {
        setProjectData(result.data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [factoryId, selectedStatus] // getProjects 제거
  );

  // 초기 데이터 로드
  useEffect(() => {
    if (factoryId) {
      loadProjects(
        currentPage,
        searchKeyword,
        sortKey === 'startDate' ? 'start_date' : 'due_date',
        sortOrder
      );
    }
  }, [
    selectedStatus,
    currentPage,
    searchKeyword,
    sortKey,
    sortOrder,
    factoryId,
    loadProjects,
  ]);

  // 검색 핸들러
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 정렬 핸들러
  const handleSort = (key: 'startDate' | 'endDate') => {
    const newSortOrder =
      sortKey === key ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc';

    if (sortKey === key) {
      setSortOrder(newSortOrder);
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
    setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
  };

  const sortedProjects = projectData?.data || [];

  const currentIds = sortedProjects.map((project) => project.project_id);
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

  const handleStatusChange = (status: ProjectStatusType | 'progress') => {
    setSelectedStatus(status);
    setCurrentPage(1); // 탭 상태 변경 시 표는 첫 페이지로 이동
    setSearchKeyword(''); // 탭 변경시 검색어도 초기화
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

  // 로딩 상태 표시 (factoryId가 없거나 데이터 로딩 중일 때)
  if (!factoryId || (isLoading && !projectData)) {
    return (
      <div className="flex justify-center items-center h-100">
        <Spinner />
      </div>
    );
  }

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
            onSearch={handleSearch}
          />
          <div className="overflow-y-auto w-full">
            <TableHeader
              isAllChecked={isAllChecked}
              onToggleAll={toggleAll}
              onSort={handleSort}
            />
            {sortedProjects.map((project) => (
              <TableItem
                key={project.project_id}
                project={project}
                checked={isChecked(project.project_id)}
                onToggle={() => toggleOne(project.project_id)}
              />
            ))}
          </div>

          {/* 페이지네이션 */}
          {projectData && projectData.pageCnt > 1 && (
            <Pagination
              currentPage={projectData.curPage}
              totalPages={projectData.pageCnt}
              onPageChange={handlePageChange}
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
