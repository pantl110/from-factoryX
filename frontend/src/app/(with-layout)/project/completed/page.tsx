'use client';

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
      if (selectedStatus === '완료') {
        status = 'completed';
      } else if (selectedStatus === '중단') {
        status = 'suspended';
      }

      const result = await getProjects({
        ...(selectedStatus === '전체'
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
      alert('삭제할 프로젝트를 선택해주세요.');
      return;
    }

    try {
      const checkedIds = currentIds.filter((id) => isChecked(id));

      // 선택된 프로젝트들을 순차적으로 삭제
      for (const projectId of checkedIds) {
        await deleteProject(projectId);
      }

      alert('프로젝트가 삭제되었습니다.');
      setAllChecked(false); // 선택 해제
      setIsDeleteModalOpen(false);

      // 프로젝트 목록 새로고침
      const result = await getProjects({
        ...(selectedStatus === '전체'
          ? {
              status_exclude:
                'quotation,confirmed,pending,production,manufactured,delivery',
            }
          : {
              status:
                selectedStatus === '완료'
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
      alert('프로젝트 삭제 중 오류가 발생했습니다.');
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
            placeholder="업체명이나 제품명을 검색하세요."
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
                  title="보관된 프로젝트가 아직 없어요."
                  text="프로젝트가 생성되면 이곳에 표시돼요. "
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
