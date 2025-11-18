'use client';

import { useState, Suspense, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import MainTitleSec from './main-title-sec';
import DocumentTable from './document-table';
import Pagination from '@/components/pagination';
import { DocumentType } from './types';
import Spinner from '@/ui/spinner';
import { useGetPublishedTaxInvoices, useGetWorkInstructions } from '@/hooks';
import {
  PublishedTaxInvoiceResponseModel,
  ProjectResponseModel,
  WorkInstructionsResponseModel,
} from '@/types/data-model';
import useGetProjects from '@/hooks/project/use-get-projects';
import SearchInput from '@/ui/search-input';

const DocumentPageContent = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>('주문서');
  const [searchQuery, setSearchQuery] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // 세금계산서 정렬 필드, 방향
  const [taxSortField, setTaxSortField] = useState<
    'created_at' | 'transaction_date'
  >('transaction_date');
  const [taxSortDirection, setTaxSortDirection] = useState<'asc' | 'desc'>(
    'desc'
  );
  // 주문서/거래명세서 정렬 방향
  const [projectSortDirection, setProjectSortDirection] = useState<
    'asc' | 'desc'
  >('desc');
  // 생산지시서 정렬 방향
  const [workInstructionSortDirection, setWorkInstructionSortDirection] =
    useState<'asc' | 'desc'>('desc');

  // 디바운스된 검색어 (500ms)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  const { getProjects, isLoading: isProjectDataLoading } = useGetProjects();
  const { getPublishedTaxInvoices, isLoading: isTaxDataLoading } =
    useGetPublishedTaxInvoices();
  const { getWorkInstructions, isLoading: isWorkInstructionLoading } =
    useGetWorkInstructions();

  // 주문서 데이터 상태
  const [orderDocuments, setOrderDocuments] = useState<ProjectResponseModel[]>(
    []
  );
  //생산지시서 데이터 상태
  const [workInstructions, setWorkInstructions] = useState<
    WorkInstructionsResponseModel[]
  >([]);
  // 거래명세서 데이터 상태
  const [transactionDocuments, setTransactionDocuments] = useState<
    ProjectResponseModel[]
  >([]);
  // 세금계산서 데이터 상태
  const [taxInvoices, setTaxInvoices] = useState<
    PublishedTaxInvoiceResponseModel[]
  >([]);

  // 세금계산서 데이터 가져오기
  useEffect(() => {
    if (
      selectedType === '매출 세금계산서' ||
      selectedType === '매입 세금계산서'
    ) {
      const fetchTaxData = async () => {
        // 정렬 파라미터 구성
        let ordering = '';
        if (taxSortField === 'transaction_date') {
          ordering =
            taxSortDirection === 'asc'
              ? 'transaction_date'
              : '-transaction_date';
        } else {
          ordering = taxSortDirection === 'asc' ? 'created_at' : '-created_at';
        }

        const result = await getPublishedTaxInvoices({
          page: currentPage,
          page_size: 10,
          q: debouncedSearchQuery || undefined,
          tax_invoice_type:
            selectedType === '매출 세금계산서' ? 'sales' : 'purchase',
          ordering,
        });

        if (result.success && result.data) {
          setTaxInvoices(result.data.data || []);
          setTotalPages(result.data.pageCnt || 1);
        }
      };
      fetchTaxData();
    } else if (selectedType === '주문서') {
      const fetchOrderData = async () => {
        const result = await getProjects({
          status_exclude: 'quotation,confirmed,suspended',
          search: debouncedSearchQuery || undefined,
          page: currentPage,
          page_size: 10,
          order_by:
            projectSortDirection === 'asc' ? 'pending_at' : '-pending_at',
        });

        if (result.success && result.data) {
          setOrderDocuments(result.data.data || []);
          setTotalPages(result.data.pageCnt || 1);
        }
      };

      fetchOrderData();
    } else if (selectedType === '생산지시서') {
      const fetchProductionData = async () => {
        const result = await getWorkInstructions(
          workInstructionSortDirection === 'asc' ? 'created_at' : '-created_at',
          currentPage,
          10,
          debouncedSearchQuery || undefined
        );

        if (result.success && result.data) {
          setWorkInstructions(result.data.data || []);
          setTotalPages(result.data.pageCnt || 1);
        }
      };
      fetchProductionData();
    } else if (selectedType === '거래명세서') {
      // 거래명세서일 때 프로젝트 완료 상태인 프로젝트 가져오기
      const fetchTransactionData = async () => {
        const result = await getProjects({
          printed_at__isnull: false,
          search: debouncedSearchQuery || undefined,
          page: currentPage,
          page_size: 10,
          order_by:
            projectSortDirection === 'asc' ? 'printed_at' : '-printed_at',
        });

        if (result.success && result.data) {
          setTransactionDocuments(result.data.data || []);
          setTotalPages(result.data.pageCnt || 1);
        }
      };

      fetchTransactionData();
    }
  }, [
    selectedType,
    currentPage,
    debouncedSearchQuery,
    taxSortField,
    taxSortDirection,
    projectSortDirection,
    workInstructionSortDirection,
    getPublishedTaxInvoices,
    getProjects,
    getWorkInstructions,
  ]);

  // 현재 표시할 데이터 결정
  const isOrderDocument = selectedType === '주문서';
  const isWorkInstructions = selectedType === '생산지시서';
  const isTransactionDocument = selectedType === '거래명세서';
  const isTaxDocument =
    selectedType === '매출 세금계산서' || selectedType === '매입 세금계산서';
  const currentData = isOrderDocument
    ? orderDocuments
    : isWorkInstructions
      ? workInstructions
      : isTransactionDocument
        ? transactionDocuments
        : isTaxDocument
          ? taxInvoices
          : [];

  // 탭 변경 핸들러
  const handleTabChange = (type: DocumentType) => {
    setSelectedType(type);
    // 탭 변경 시 첫 페이지로 이동하고 체크박스 초기화, 검색어 초기화
    setCurrentPage(1);
    setSearchQuery('');
  };

  return (
    <>
      <div className="flex flex-col gap-8 w-full">
        <MainTitleSec
          selectedType={selectedType}
          setSelectedType={handleTabChange}
        />

        <div className="px-10 pb-10">
          <div className="pb-6">
            <SearchInput
              onChange={(query: string) => {
                setSearchQuery(query);
                setCurrentPage(1); // 검색 시 첫 페이지로 이동
              }}
              value={searchQuery}
              placeholder="검색어를 입력하세요."
            />
          </div>

          {(isTaxDocument && isTaxDataLoading) ||
          (isWorkInstructions && isWorkInstructionLoading) ||
          (!isTaxDocument && !isWorkInstructions && isProjectDataLoading) ? (
            <div className="flex justify-center items-center h-100">
              <Spinner />
            </div>
          ) : (
            <DocumentTable
              data={currentData}
              selectedType={selectedType}
              // 세금계산서 정렬
              onTaxSortChange={(field, direction) => {
                setTaxSortField(field);
                setTaxSortDirection(direction);
                setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
              }}
              taxSortField={taxSortField}
              taxSortDirection={taxSortDirection}
              // 주문서/거래명세서 정렬
              onProjectSortClick={(direction) => {
                setProjectSortDirection(direction);
                setCurrentPage(1);
              }}
              projectSortDirection={projectSortDirection}
              // 생산지시서 정렬
              onWorkInstructionSortClick={(direction) => {
                setWorkInstructionSortDirection(direction);
                setCurrentPage(1);
              }}
              workInstructionSortDirection={workInstructionSortDirection}
            />
          )}
          {totalPages >= 2 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      </div>
    </>
  );
};

const DocumentPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <DocumentPageContent />
    </Suspense>
  );
};

export default DocumentPage;
