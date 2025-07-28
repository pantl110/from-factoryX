import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import { CaretUpDown } from '@phosphor-icons/react';
import SearchOrderTableItem from './search-order-table-item';
import { useState, useEffect } from 'react';
import { useGetProjects } from '@/hooks';
import useFactoryStore from '@/store/factory-store';
import Pagination from '@/components/pagination';
import { ProjectResponseModel } from '@/types/data-model';

interface SearchOrderModalProps {
  onClose: () => void;
}

const SearchOrderModal = ({ onClose }: SearchOrderModalProps) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [orderProjects, setOrderProjects] = useState<ProjectResponseModel[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const factoryId = useFactoryStore((state) => state.factoryId);
  const { getProjects, isLoading } = useGetProjects(); // 프로젝트가 아니라 문서함에서 가져와야함.

  // 검색어나 페이지가 변경될 때마다 주문서 상태의 프로젝트 조회
  useEffect(() => {
    const fetchOrderProjects = async () => {
      if (factoryId) {
        const result = await getProjects({
          factory_id: factoryId,
          status: 'order', // 주문서 상태만 조회
          search: searchKeyword || undefined,
          page: currentPage,
          size: 5, // 페이지당 5개씩
        });

        if (result.success && result.data) {
          setOrderProjects(result.data.data || []);
          setTotalPages(result.data.pageCnt || 1);
        }
      }
    };

    const timeoutId = setTimeout(fetchOrderProjects, 300); // 디바운스
    return () => clearTimeout(timeoutId);
  }, [searchKeyword, currentPage, factoryId, getProjects]);

  // 검색어가 변경되면 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchKeyword]);

  return (
    <Modal
      title="이전에 주문을 진행했던 업체명을 입력해주세요."
      subtitle="업체명을 검색하면 해당 업체와의 기존 주문서를 불러올 수 있어요."
      width="w-[1000px]"
      onClose={onClose}
    >
      <div className="mt-4 mb-4 w-full">
        <SearchInput
          placeholder="주문서를 불러올 업체를 검색하세요."
          width="w-full"
          value={searchKeyword}
          onChange={setSearchKeyword}
        />
      </div>
      <div>
        <div className="flex items-center h-12 w-full border-t border-b border-lg Me_Body-1">
          <p className="flex-[0.5] px-3 text-sv">구분</p>
          <p className="flex-1 px-3 text-sv">업체명</p>
          <p className="flex-1 px-3 text-sv">품목명</p>
          <div className="flex-[0.6] px-3 h-full flex items-center gap-1 hover:bg-bg cursor-pointer">
            <p className=" text-sv">등록일자</p>
            <CaretUpDown size={21} className="text-sv" />
          </div>
        </div>
        {isLoading ? (
          <></>
        ) : orderProjects.length > 0 ? (
          orderProjects.map((project) => (
            <SearchOrderTableItem key={project.project_id} project={project} />
          ))
        ) : (
          <></>
        )}

        {/* 페이지네이션 */}
        {!isLoading && orderProjects.length > 0 && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SearchOrderModal;
