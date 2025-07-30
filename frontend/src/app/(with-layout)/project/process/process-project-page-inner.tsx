'use client';

import { useState, useEffect } from 'react';
import MainTitleSec from './main-title-sec';
import SearchDeleteTable from '@/ui/search-delete-table';
import { ProjectStatusType } from '@/types/status-type';
import TableHeader from './table-header';
import TableItem from './table-item';
import ExcelUploadModal from './modals/excel-upload-modal';
import { useSearchParams, useRouter } from 'next/navigation';
import Pagination from '@/components/pagination';
import { OcrDataModel, ProjectListResponseModel } from '@/types/data-model';
import DeleteModal from '@/ui/modal/delete-modal';
import Spinner from '@/ui/spinner';
import { useCreateProject, useGetProjects, useCheckAll } from '@/hooks';
import useFactoryStore from '@/store/factory-store';

const ProcessProjectPageInner = () => {
  const router = useRouter();
  const { getProjects, isLoading } = useGetProjects();
  const { createProject } = useCreateProject();
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

  // 드랍다운, 모달 상태
  const [isSelectDropdownOpen, setIsSelectDropdownOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isOrderUploadModalOpen, setIsOrderUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // 데이터 상태
  const [projectData, setProjectData] =
    useState<ProjectListResponseModel | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortKey, setSortKey] = useState<'startDate' | 'endDate'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 초기 데이터 로드
  useEffect(() => {
    const loadProjects = async () => {
      if (!factoryId) return;

      const result = await getProjects({
        factory_id: factoryId,
        status: selectedStatus,
        search: searchKeyword,
        order_by: sortKey === 'startDate' ? 'start_date' : 'due_date',
        order_dir: sortOrder,
        page: currentPage,
        size: 10,
      });

      if (result.success && result.data) {
        setProjectData(result.data);
      }
    };

    loadProjects();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedStatus,
    currentPage,
    searchKeyword,
    sortKey,
    sortOrder,
    factoryId,
    // getProjects,
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
    setIsSelectDropdownOpen(true);
  };

  const handleOpenUploadModal = () => {
    setIsSelectDropdownOpen(false);
    setIsUploadModalOpen(true);
  };
  const handleOpenOrderUploadModal = () => {
    setIsSelectDropdownOpen(false);
    setIsOrderUploadModalOpen(true);
  };

  const handleTabChange = (status: ProjectStatusType | 'progress') => {
    setSelectedStatus(status);
    setCurrentPage(1); // 탭 상태 변경 시 표는 첫 페이지로 이동
    setSearchKeyword(''); // 탭 변경시 검색어도 초기화
  };

  const handleDirectInputClick = async (ocrData?: OcrDataModel) => {
    if (ocrData) {
      // OCR data로 프로젝트와 견적서 생성 후 이동 필요 ‼️‼️‼️‼️
    } else {
      // 빈 값으로 프로젝트와 견적서 생성 후 견적서 아이디 기억하고 이동
      try {
        // 프로젝트와 견적서 생성
        const result = await createProject();

        if (result.success && result.data) {
          // 생성된 견적서 ID를 URL 파라미터로 전달하여 견적서 페이지로 이동
          router.push(`/quotation?id=${result.data.id}`);
        } else {
          alert('프로젝트 생성에 실패했습니다.');
        }
      } catch {
        alert('프로젝트 생성 중 오류가 발생했습니다.');
      }
    }
  };

  // 테스트 프로젝트 생성 핸들러
  const handleCreateTestProjects = async () => {
    if (!factoryId) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/project/test`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            factory_id: factoryId,
          }),
        }
      );
      if (res.ok) {
        alert('테스트 프로젝트가 생성되었습니다.');
        // 새로고침
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.detail || '테스트 프로젝트 생성에 실패했습니다.');
      }
    } catch {
      alert('테스트 프로젝트 생성 중 오류가 발생했습니다.');
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
          onStatusChange={handleTabChange}
          isSelectDropdownOpen={isSelectDropdownOpen}
          onSelectDropdownClose={() => setIsSelectDropdownOpen(false)}
          onUploadClick={handleOpenUploadModal}
          onDirectInputClick={handleDirectInputClick}
          onOrderUploadClick={handleOpenOrderUploadModal}
        />

        {/* 테스트 프로젝트 생성 버튼 */}
        <div className="px-10 pb-2">
          <button
            className="bg-primary-8 text-white px-4 py-2 rounded hover:bg-primary"
            onClick={handleCreateTestProjects}
            type="button"
          >
            테스트 프로젝트 일괄 생성
          </button>
        </div>

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

      {/* 견적요청서/주문서 파일 업로드 모달 */}
      {(isUploadModalOpen || isOrderUploadModalOpen) && (
        <ExcelUploadModal
          documentTitle={isUploadModalOpen ? '견적 요청서' : '주문서'}
          onClose={() => setIsUploadModalOpen(false)}
          onComplete={handleDirectInputClick}
        />
      )}

      {/* 프로젝트 삭제 모달 */}
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
