import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import MiniBtn from '@/ui/mini-btn';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import LinkModalProjectTable from './link-modal-project-table';
import { useGetUnlinkedTaxInvoices } from '@/hooks';
import {
  useLinkTaxInvoice,
  useGetMaterialHistory,
  useConnectMaterialHistory,
} from '@/hooks';
import { convertUTCToKSTDate } from '@/hooks';
import {
  UnlinkedTaxInvoiceListResponseModel,
  TaxLineItemModel,
  ProjectStatusResponseModel,
  MaterialHistoryListResponseModel,
} from '@/types/data-model';
import MaterialInfoTable from './material-info-table';
import LinkModalTaxTable from './link-modal-tax-table';

interface LinkTaxModalProps {
  onClose: () => void;
  type: 'project' | 'tax';
  linkedItemId: number; // type이 'project'일 때는 프로젝트 아이디, type이 'tax'일 때는 세금계산서 아이디
  selectedLineItem?: TaxLineItemModel; // type이 'tax'일 때 선택한 lineItem
  clientId?: number; // type이 'tax'일 때 세금계산서의 거래처 ID
  onSuccess?: () => void; // 연결 완료 시 호출되는 콜백
  canCreate?: boolean; // 세금계산서 생성 가능 여부
  projectStatus?: ProjectStatusResponseModel; // 세금계산서 생성 시 보여줄 초기값을 위함
  setIsTaxPanelOpen?: (isOpen: boolean) => void; // 세금계산서 생성 시 보여줄 초기값을 위함
}

const LinkTaxModal = ({
  onClose,
  linkedItemId,
  type,
  selectedLineItem,
  clientId,
  onSuccess,
  canCreate = false,
  setIsTaxPanelOpen,
}: LinkTaxModalProps) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'1' | '6' | '12'>('1');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordering, setOrdering] = useState<string>('-transaction_date');
  const [taxInvoiceData, setTaxInvoiceData] =
    useState<UnlinkedTaxInvoiceListResponseModel | null>(null);
  const [materialHistoryData, setMaterialHistoryData] =
    useState<MaterialHistoryListResponseModel | null>(null);
  const [debouncedSearchKeyword] = useDebounce(searchKeyword, 300);

  // 선택한 세금계산서 아이디 선택 관련
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { getUnlinkedTaxInvoices, isLoading: isUnlinkedTaxLoading } =
    useGetUnlinkedTaxInvoices();
  const { getMaterialHistory, isLoading: isMaterialHistoryLoading } =
    useGetMaterialHistory();
  const { linkTaxInvoice, isLoading: isLinking } = useLinkTaxInvoice();
  const { connectMaterialHistory, isLoading: isConnecting } =
    useConnectMaterialHistory();

  // type이 'project'일 때 연결되지 않은 세금계산서 데이터 가져오기
  const loadUnlinkedTaxInvoices = useCallback(async () => {
    try {
      // 기간 계산
      const endDate = new Date();
      const startDate = new Date();
      if (selectedPeriod === '1') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (selectedPeriod === '6') {
        startDate.setMonth(startDate.getMonth() - 6);
      } else if (selectedPeriod === '12') {
        startDate.setMonth(startDate.getMonth() - 12);
      }

      const result = await getUnlinkedTaxInvoices({
        q: debouncedSearchKeyword,
        page: currentPage,
        page_size: 5,
        start_date: convertUTCToKSTDate(startDate.toISOString()),
        end_date: convertUTCToKSTDate(endDate.toISOString()),
        ordering,
        tax_invoice_type: 'sales',
        is_hidden: false,
      });

      if (result.success && result.data) {
        // 데이터를 Table에 전달할 수 있도록 상태에 저장
        setTaxInvoiceData(result.data);
      }
    } catch {
      // 오류
    }
  }, [
    debouncedSearchKeyword,
    currentPage,
    ordering,
    selectedPeriod,
    getUnlinkedTaxInvoices,
  ]);

  // type이 'tax'일 때 원자재 히스토리 데이터 가져오기
  const loadMaterialHistory = useCallback(async () => {
    try {
      if (!clientId) return;

      const result = await getMaterialHistory({
        client_id: clientId,
        material_name: debouncedSearchKeyword || undefined,
        page: currentPage,
        page_size: 5,
        type: 'purchase', // 구매 내역만 조회
        is_linked: false, // 세금계산서나 현금영수증이 연결 안된 내역만 조회
      });

      if (result.success && result.data) {
        setMaterialHistoryData(result.data);
      }
    } catch {
      // 오류
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, debouncedSearchKeyword, currentPage]);

  // 컴포넌트 마운트 시와 검색어 변경 시 데이터 로드
  useEffect(() => {
    if (type === 'project') {
      loadUnlinkedTaxInvoices();
    } else if (type === 'tax') {
      loadMaterialHistory();
    }
  }, [type, loadUnlinkedTaxInvoices, loadMaterialHistory]);

  // 페이지 변경 핸들러
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    setSelectedId(null); // 페이지 변경 시 선택된 아이템 초기화
  }, []);

  // 검색어나 기간 변경 시 페이지를 1로
  useEffect(() => {
    setCurrentPage(1);
    setSelectedId(null); // 선택된 아이템 초기화
  }, [debouncedSearchKeyword, selectedPeriod]);

  // 정렬 변경 시 페이지를 1로 리셋
  useEffect(() => {
    setCurrentPage(1);
    setSelectedId(null); // 선택된 아이템 초기화
  }, [ordering]);

  const handleLinkButtonClick = async () => {
    if (!selectedId || !linkedItemId) return;

    if (type === 'project') {
      const result = await linkTaxInvoice({
        project_id: linkedItemId,
        tax_id: selectedId,
      });
      if (result.success) {
        onSuccess?.(); // 연결 성공 시 리로드 콜백 호출
        onClose();
      }
    } else if (type === 'tax') {
      if (!selectedLineItem?.id) {
        alert('연결할 세금계산서 품목을 선택해주세요.');
        return;
      }

      const result = await connectMaterialHistory(linkedItemId, {
        line_item_id: selectedLineItem.id,
        material_history_id: selectedId,
      });

      if (result.success) {
        onSuccess?.(); // 연결 성공 시 리로드 콜백 호출
        onClose();
      }
    }
  };

  return (
    <Modal
      width="w-[1000px]"
      title={
        type === 'project'
          ? '프로젝트에 연결할 매출 세금계산서를 선택해주세요.'
          : `${type === 'tax' ? '매입 세금계산서' : '현금영수증'}에서 선택한 원자재를 구매 내역에 연결하세요.`
      }
      subtitle={
        type === 'project'
          ? '세금계산서를 프로젝트와 연동하면, 거래 내역이 자동으로 반영돼요.'
          : `${type === 'tax' ? '세금계산서' : '현금영수증'} 품목명과 시스템 자재명이 다를 수 있어요. 연결하면 재고·단가·추적 정보를 정확하게 관리할 수 있어요.`
      }
      onClose={onClose}
      scroll={true}
    >
      <div className="flex flex-col gap-4 mt-4 px-6">
        {/* material history 연결 시 연결할 line item 보여주기 */}
        {type !== 'project' && (
          <div className="flex flex-col gap-3">
            <h4 className="Heading-4 text-dg">
              매입 세금계산서에서 선택한 원자재
            </h4>
            {selectedLineItem && (
              <MaterialInfoTable lineItem={selectedLineItem} />
            )}
          </div>
        )}

        <SearchInput
          placeholder={
            type === 'project'
              ? '연결할 내역에 대한 거래처를 검색하세요.'
              : '연결할 내역에 대한 원자재를 검색하세요.'
          }
          onChange={(value) => setSearchKeyword(value)}
        />

        {/* 프로적트 연결 시 기간 선택 */}
        {type === 'project' && (
          <div className="flex gap-2">
            <MiniBtn
              text="1개월"
              hoverColor="hover:bg-bg"
              borderColor={
                selectedPeriod === '1' ? 'border-primary' : 'border-lg'
              }
              textColor={selectedPeriod === '1' ? 'text-primary' : 'text-dg'}
              bgColor={selectedPeriod === '1' ? 'bg-primary-8' : 'bg-white'}
              onClick={() => setSelectedPeriod('1')}
            />
            <MiniBtn
              text="6개월"
              hoverColor="hover:bg-bg"
              borderColor={
                selectedPeriod === '6' ? 'border-primary' : 'border-lg'
              }
              textColor={selectedPeriod === '6' ? 'text-primary' : 'text-dg'}
              bgColor={selectedPeriod === '6' ? 'bg-primary-8' : 'bg-white'}
              onClick={() => setSelectedPeriod('6')}
            />
            <MiniBtn
              text="12개월"
              hoverColor="hover:bg-bg"
              borderColor={
                selectedPeriod === '12' ? 'border-primary' : 'border-lg'
              }
              textColor={selectedPeriod === '12' ? 'text-primary' : 'text-dg'}
              bgColor={selectedPeriod === '12' ? 'bg-primary-8' : 'bg-white'}
              onClick={() => setSelectedPeriod('12')}
            />
          </div>
        )}

        {/* 연결할 item들 표 */}
        <div
          className={`flex flex-col gap-2 overflow-y-auto pb-6 scrollbar-hide ${
            type === 'project'
              ? 'max-h-[calc(85vh-256.8px)]'
              : 'max-h-[calc(85vh-332.2px)]'
          }`}
        >
          {type === 'project' ? (
            <LinkModalProjectTable
              items={taxInvoiceData?.data || []}
              currentPage={currentPage}
              totalPages={taxInvoiceData?.pageCnt || 1}
              onPageChange={handlePageChange}
              onOrderingToggle={() => {
                setOrdering(
                  ordering === '-transaction_date'
                    ? 'transaction_date'
                    : '-transaction_date'
                );
              }}
              isLoading={isUnlinkedTaxLoading}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
            />
          ) : (
            <LinkModalTaxTable
              items={materialHistoryData?.data || []}
              currentPage={currentPage}
              totalPages={materialHistoryData?.pageCnt || 1}
              onPageChange={handlePageChange}
              isLoading={isMaterialHistoryLoading}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
            />
          )}
          <div
            className={`flex gap-2.5 pt-2 ${
              canCreate ? 'justify-between' : 'justify-end'
            }`}
          >
            <MiniBtn
              text="취소"
              hoverColor="hover:bg-bg"
              textColor="text-sv"
              onClick={onClose}
            />
            <div className="flex gap-2.5">
              {canCreate && (
                <MiniBtn
                  text="세금계산서 생성"
                  hoverColor="hover:bg-bg"
                  borderColor="border-lg"
                  textColor="text-dg"
                  onClick={() => {
                    setIsTaxPanelOpen?.(true);
                    onClose();
                  }}
                />
              )}
              <MiniBtn
                text="내역 연결"
                hoverColor="hover:bg-primary-hover"
                bgColor="bg-primary"
                textColor="text-wh"
                disabled={!selectedId || isLinking || isConnecting}
                onClick={handleLinkButtonClick}
              />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default LinkTaxModal;
