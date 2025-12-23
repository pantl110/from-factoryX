import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import LinkProjectTable from './link-project-table';
import { ProjectResponseModel } from '@/types/data-model';
import useGetUnlinkedProjects from '@/hooks/project/use-get-unlinked-projects';
import useLinkTaxInvoice from '@/hooks/tax/use-link-tax-invoice';

interface LinkProjectModalProps {
  onClose: () => void;
  taxId: number; // 세금계산서 ID
  onSuccess?: () => void; // 연결 완료 시 호출되는 콜백
}

const LinkProjectModal = ({
  onClose,
  taxId,
  onSuccess,
}: LinkProjectModalProps) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [orderBy, setOrderBy] = useState<string>('-start_date');
  const [projectData, setProjectData] = useState<{
    data: ProjectResponseModel[];
    pageCnt: number;
  } | null>(null);
  const [debouncedSearchKeyword] = useDebounce(searchKeyword, 300);

  // 선택한 프로젝트 아이디
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { getUnlinkedProjects, isLoading } = useGetUnlinkedProjects();
  const { linkTaxInvoice, isLoading: isLinking } = useLinkTaxInvoice();

  // 세금계산서와 연결되지 않은 프로젝트 조회
  const loadUnlinkedProjects = useCallback(async () => {
    const result = await getUnlinkedProjects({
      search: debouncedSearchKeyword || undefined,
      page: currentPage,
      page_size: 5,
      order_by: orderBy,
    });
    if (result.success && result.data) {
      setProjectData({
        data: result.data.data || [],
        pageCnt: result.data.pageCnt || 1,
      });
    }
  }, [debouncedSearchKeyword, currentPage, orderBy, getUnlinkedProjects]);

  // 검색어, 페이지, 정렬 변경 시 프로젝트 목록 다시 불러오기
  useEffect(() => {
    loadUnlinkedProjects();
  }, [loadUnlinkedProjects]);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedId(null); // 페이지 변경 시 선택된 아이템 초기화
  }, []);

  // 검색어 변경 시 페이지를 1로
  useEffect(() => {
    setCurrentPage(1);
    setSelectedId(null); // 선택된 아이템 초기화
  }, [debouncedSearchKeyword]);

  // 정렬 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
    setSelectedId(null); // 선택된 아이템 초기화
  }, [orderBy]);

  const handleLinkButtonClick = async () => {
    if (!selectedId || !taxId) return;

    const result = await linkTaxInvoice({
      project_id: selectedId,
      tax_id: taxId,
    });
    if (result.success) {
      onSuccess?.(); // 연결 성공 시 리로드 콜백 호출
      onClose();
    }
  };

  return (
    <Modal
      width="w-[1000px]"
      title="세금계산서에 연결할 프로젝트를 선택해주세요."
      subtitle="프로젝트를 세금계산서와 연동하면, 거래 내역이 자동으로 반영돼요."
      onClose={onClose}
      scroll={true}
    >
      <div className="flex flex-col gap-4 mt-4 px-6">
        <SearchInput
          placeholder="연결할 프로젝트의 거래처명이나 제품명을 입력해 검색하세요."
          onChange={(value) => setSearchKeyword(value)}
        />

        {/* 연결할 프로젝트 목록 표 */}
        <div className="flex flex-col gap-2 overflow-y-auto pb-6 scrollbar-hide max-h-[calc(85vh-256.8px)]">
          <LinkProjectTable
            items={projectData?.data || []}
            currentPage={currentPage}
            totalPages={projectData?.pageCnt || 1}
            onPageChange={handlePageChange}
            onOrderingToggle={() => {
              setOrderBy(
                orderBy === '-start_date' ? 'start_date' : '-start_date'
              );
            }}
            isLoading={isLoading}
            selectedId={selectedId}
            setSelectedId={setSelectedId}
          />
          <div className="flex gap-2.5 pt-2 justify-end">
            <MiniBtn text="취소" variant="white" onClick={onClose} />
            <MiniBtn
              text="프로젝트 연결하기"
              hoverColor="hover:bg-primary-hover"
              variant="primary"
              disabled={!selectedId || isLinking}
              onClick={handleLinkButtonClick}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkProjectModal;
