'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import MainTitleSec from './main-title-sec';
import SearchDeleteTable from '@/ui/search-delete-table';
import TableHeader from '../process/table-header';
import TableItem from '../process/table-item';
import {
  CompletedProjectStatusType,
  ProjectStatusType,
} from '@/types/status-type';
import Pagination from '@/components/pagination';
import { useCheckAll, useGetProjects, useDeleteProject } from '@/hooks';
import DeleteModal from '@/ui/modal/delete-modal';
import { ProjectListResponseModel } from '@/types/data-model';
import Spinner from '@/ui/spinner';
import NoHistoryBox from '@/ui/no-history-box';

const CompletedProjectPage = () => {
  const t = useTranslations('project.completed');
  const tFilters = useTranslations('project.completed.filters');
  const { getProjects, isLoading: isProjectsLoading } = useGetProjects();
  const { deleteProject, isLoading: isDeleteLoading } = useDeleteProject();

  const [selectedStatus, setSelectedStatus] = useState<
    '전체' | CompletedProjectStatusType
  >('전체');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sortKey, setSortKey] = useState<'startDate' | 'endDate'>('startDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [projectData, setProjectData] =
    useState<ProjectListResponseModel | null>(null);

  // 초기 데이터 로드
  useEffect(() => {
    if (!getProjects) return;

    const loadArchivedProjects = async () => {
      let status;

      // 개별 상태 선택 시
      if (selectedStatus === tFilters('completed')) {
        status = 'completed';
      } else if (selectedStatus === tFilters('suspended')) {
        status = 'suspended';
      }

      const result = await getProjects({
        ...(selectedStatus === tFilters('all')
          ? {
              status_exclude:
                'quotation,confirmed,pending,production,manufactured,delivery',
            }
          : { status: status as ProjectStatusType }),
        search: searchKeyword,
        order_by:
          sortKey === 'startDate'
            ? sortOrder === 'desc'
              ? '-start_date'
              : 'start_date'
            : sortOrder === 'desc'
              ? '-due_date'
              : 'due_date',
        page: currentPage,
        page_size: 10,
      });

      if (result.success && result.data) {
        setProjectData(result.data);
      }
    };

    loadArchivedProjects();
  }, [
    getProjects,
    selectedStatus,
    searchKeyword,
    sortKey,
    sortOrder,
    currentPage,
    tFilters,
  ]);

  const currentIds = projectData?.data.map((project) => project.id) || [];

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(currentIds);

  const handleStatusChange = (status: '전체' | CompletedProjectStatusType) => {
    setSelectedStatus(status);
    setCurrentPage(1); // 상태 변경 시 첫 페이지로 이동
    setSearchKeyword(''); // 탭 변경시 검색어도 초기화
    setAllChecked(false); // 탭 변경 시 체크 상태 초기화
  };

  // 검색 핸들러
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // 페이지 유효성 관리 (삭제나 비어 있는 페이지 처리)
  useEffect(() => {
    const totalPages = projectData?.pageCnt || 0;
    const hasData = (projectData?.data?.length ?? 0) > 0;

    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
      return;
    }

    if (!isProjectsLoading && currentPage > 1 && !hasData) {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    }
  }, [
    projectData?.pageCnt,
    projectData?.data?.length,
    currentPage,
    isProjectsLoading,
  ]);

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

  // 선택된 프로젝트 삭제 핸들러
  const handleDeleteProjects = async () => {
    if (checkedCount === 0) {
      alert(t('errors.selectProject'));
      return;
    }

    try {
      const checkedIds = currentIds.filter((id) => isChecked(id));

      // 선택된 프로젝트들을 순차적으로 삭제
      for (const projectId of checkedIds) {
        await deleteProject(projectId);
      }

      alert(t('deleteSuccess'));
      setAllChecked(false); // 선택 해제
      setIsDeleteModalOpen(false);

      // 프로젝트 목록 새로고침
      const result = await getProjects({
        ...(selectedStatus === tFilters('all')
          ? {
              status_exclude:
                'quotation,confirmed,pending,production,manufactured,delivery',
            }
          : {
              status:
                selectedStatus === tFilters('completed')
                  ? 'completed'
                  : ('suspended' as ProjectStatusType),
            }),
        search: searchKeyword,
        order_by:
          sortKey === 'startDate'
            ? sortOrder === 'desc'
              ? '-start_date'
              : 'start_date'
            : sortOrder === 'desc'
              ? '-due_date'
              : 'due_date',
        page: currentPage,
        page_size: 10,
      });

      if (result.success && result.data) {
        setProjectData(result.data);
      }
    } catch {
      alert(t('errors.deleteError'));
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          selectedStatus={selectedStatus}
          onStatusChange={handleStatusChange}
        />
        <div className="px-10 pb-10">
          <SearchDeleteTable
            placeholder={t('searchPlaceholder')}
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCancel={() => setAllChecked(false)}
            onSearch={handleSearch}
            searchKeyword={searchKeyword}
            hasData={
              !!projectData?.data.length || (projectData?.data.length || 0) > 0
            }
          />

          {isProjectsLoading && !projectData ? (
            <div className="flex justify-center items-center h-100">
              <Spinner />
            </div>
          ) : (
            <>
              {!projectData?.data || projectData?.data?.length === 0 ? (
                <NoHistoryBox
                  title={t('empty.title')}
                  text={t('empty.description')}
                />
              ) : (
                <>
                  <div className="overflow-y-auto w-full">
                    <TableHeader
                      isAllChecked={isAllChecked}
                      onToggleAll={toggleAll}
                      onSort={handleSort}
                      isArchived={true}
                    />
                    {projectData?.data.map((project) => (
                      <TableItem
                        key={project.id}
                        project={project}
                        checked={isChecked(project.id)}
                        onToggle={() => toggleOne(project.id)}
                        isArchived={true}
                      />
                    ))}
                  </div>
                  {/* 페이지네이션 */}
                  {projectData &&
                    projectData.pageCnt &&
                    projectData.pageCnt > 1 && (
                      <Pagination
                        currentPage={projectData.curPage || 1}
                        totalPages={projectData.pageCnt}
                        onPageChange={handlePageChange}
                      />
                    )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDeleteProjects}
          isLoading={isDeleteLoading}
        />
      )}
    </>
  );
};

export default CompletedProjectPage;
