import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import LinkModalTable from './link-modal-table';
import { useGetUnlinkedTaxInvoices } from '@/hooks';
import useLinkTaxInvoice from '@/hooks/tax/use-link-tax-invoice';
import { UnlinkedTaxInvoiceListResponseModel } from '@/types/data-model';

interface LinkTaxModalProps {
  onClose: () => void;
  projectId: number;
}

const LinkTaxModal = ({ onClose, projectId }: LinkTaxModalProps) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPeriod, _setSelectedPeriod] = useState<'1' | '6' | '12'>('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [taxInvoiceData, setTaxInvoiceData] =
    useState<UnlinkedTaxInvoiceListResponseModel | null>(null);
  const [debouncedSearchKeyword] = useDebounce(searchKeyword, 300);

  // 선택한 세금계산서 아이디 선택 관련
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { getUnlinkedTaxInvoices, isLoading } = useGetUnlinkedTaxInvoices();
  const { linkTaxInvoice, isLoading: isLinking } = useLinkTaxInvoice();

  // type이 'project'일 때만 연결되지 않은 세금계산서 데이터 가져오기
  const loadUnlinkedTaxInvoices = useCallback(async () => {
    try {
      const result = await getUnlinkedTaxInvoices({
        q: debouncedSearchKeyword,
        page: currentPage,
        page_size: 5,
      });

      if (result.success && result.data) {
        // 데이터를 Table에 전달할 수 있도록 상태에 저장
        setTaxInvoiceData(result.data);
      }
    } catch {
      // 오류
    }
  }, [debouncedSearchKeyword, currentPage, getUnlinkedTaxInvoices]);

  // 컴포넌트 마운트 시와 검색어 변경 시 데이터 로드
  useEffect(() => {
    loadUnlinkedTaxInvoices();
  }, [loadUnlinkedTaxInvoices]);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // 검색어나 기간 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchKeyword, selectedPeriod]);

  return (
    <Modal
      width="w-[1000px]"
      title="프로젝트에 연결할 매출 세금계산서를 선택해주세요."
      subtitle="세금계산서를 프로젝트와 연동하면, 거래 내역이 자동으로 반영돼요."
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 mt-4">
        <SearchInput
          placeholder="연결할 내역에 대한 거래처를 검색하세요."
          onChange={(value) => setSearchKeyword(value)}
        />

        <div className="flex gap-2">
          <MiniBtn
            text="1개월"
            hoverColor="hover:bg-bg"
            borderColor="border-lg"
            textColor="text-dg"
          />
          <MiniBtn
            text="6개월"
            hoverColor="hover:bg-bg"
            borderColor="border-lg"
            textColor="text-dg"
          />
          <MiniBtn
            text="12개월"
            hoverColor="hover:bg-bg"
            borderColor="border-lg"
            textColor="text-dg"
          />
        </div>

        <LinkModalTable
          items={taxInvoiceData?.data || []}
          currentPage={currentPage}
          totalPages={taxInvoiceData?.pageCnt || 1}
          onPageChange={handlePageChange}
          isLoading={isLoading}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
        />

        <div className="flex gap-4 justify-end">
          <MiniBtn
            text="취소"
            hoverColor="hover:bg-bg"
            textColor="text-sv"
            onClick={onClose}
          />
          <MiniBtn
            text="내역연결"
            hoverColor="hover:bg-primary-hover"
            bgColor="bg-primary"
            textColor="text-wh"
            disabled={!selectedId || isLinking}
            onClick={async () => {
              if (!selectedId || !projectId) return;
              const result = await linkTaxInvoice({
                project_id: projectId,
                tax_id: selectedId,
              });
              if (result.success) {
                onClose();
              }
            }}
          />
        </div>
      </div>
    </Modal>
  );
};

export default LinkTaxModal;
