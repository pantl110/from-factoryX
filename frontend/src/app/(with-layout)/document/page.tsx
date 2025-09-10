'use client';

import { useState, Suspense, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import SearchDeleteTable from '@/ui/search-delete-table';
import MainTitleSec from './main-title-sec';
import DocumentTable from './document-table';
import Pagination from '@/components/pagination';
import { DocumentType } from './types';
import OrderDocumentView from './order-document-view';
import documentData, { DocumentDataModel } from '@/mocks/document-data';
import Panel from '@/ui/panel';
import ProductionDocumentView from './production-document-view';
import Spinner from '@/ui/spinner';
import { useCheckAll } from '@/hooks/use-check-all';
import DeleteModal from '@/ui/modal/delete-modal';
import { useGetPublishedTaxInvoices } from '@/hooks';
import {
  PublishedTaxInvoiceResponseModel,
  ProjectResponseModel,
} from '@/types/data-model';
import useGetProjects from '@/hooks/project/use-get-projects';

const DocumentPageContent = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>('주문서');
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentDataModel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  // 세금계산서 정렬 필드, 방향
  const [taxSortField, setTaxSortField] = useState<
    'created_at' | 'transaction_date'
  >('transaction_date');
  const [taxSortDirection, setTaxSortDirection] = useState<'asc' | 'desc'>(
    'desc'
  );

  // 디바운스된 검색어 (500ms)
  const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

  // 세금계산서 API 훅
  const { getPublishedTaxInvoices, isLoading: isTaxDataLoading } =
    useGetPublishedTaxInvoices();
  // 프로젝트 API 훅
  const { getProjects, isLoading: isProjectDataLoading } = useGetProjects();

  // 세금계산서 데이터 상태
  const [taxInvoices, setTaxInvoices] = useState<
    PublishedTaxInvoiceResponseModel[]
  >([]);
  const [taxInvoicesPageInfo, setTaxInvoicesPageInfo] = useState({
    pageCnt: 1,
    currentPage: 1,
  });

  // 거래명세서 데이터 상태
  const [transactionDocuments, setTransactionDocuments] = useState<
    ProjectResponseModel[]
  >([]);
  const [transactionDocumentsPageInfo, setTransactionDocumentsPageInfo] =
    useState({
      pageCnt: 1,
      currentPage: 1,
    });

  // 일반 문서 데이터 (기존 mock 데이터)
  const filteredData = documentData.filter(
    (item) => item.documentType === selectedType
  );

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
          setTaxInvoicesPageInfo({
            pageCnt: result.data.pageCnt || 1,
            currentPage,
          });
        }
      };

      fetchTaxData();
    } else if (selectedType === '거래명세서') {
      // 거래명세서일 때 프로젝트 완료 상태인 프로젝트 가져오기
      const fetchProjectData = async () => {
        const result = await getProjects({
          status: 'completed',
          search: debouncedSearchQuery || undefined,
          page: currentPage,
          page_size: 10,
          order_by: '-start_date',
        });

        if (result.success && result.data) {
          setTransactionDocuments(result.data.data || []);
          setTransactionDocumentsPageInfo({
            pageCnt: result.data.pageCnt || 1,
            currentPage,
          });
        }
      };

      fetchProjectData();
    }
  }, [
    selectedType,
    currentPage,
    debouncedSearchQuery,
    taxSortField,
    taxSortDirection,
    getPublishedTaxInvoices,
    getProjects,
  ]);

  // 현재 표시할 데이터 결정
  const isTaxDocument =
    selectedType === '매출 세금계산서' || selectedType === '매입 세금계산서';
  const isTransactionDocument = selectedType === '거래명세서';
  const currentData = isTaxDocument
    ? taxInvoices
    : isTransactionDocument
      ? transactionDocuments
      : filteredData;
  const totalPages = isTaxDocument
    ? taxInvoicesPageInfo.pageCnt
    : isTransactionDocument
      ? transactionDocumentsPageInfo.pageCnt
      : Math.ceil(filteredData.length / 10);

  // 체크박스 관리
  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(
    currentData.map((item) => {
      if ('id' in item) {
        return item.id;
      } else if ('project_id' in item) {
        return item.project_id; // ‼️‼️‼️‼️‼️‼️‼️세금계산서 일때는 삭제가 필요하지 않을 수 있음
      }
      return '';
    })
  );

  const handleDocumentClick = (document: DocumentDataModel) => {
    setSelectedDocument(document);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(false);
    setAllChecked(false);
  };

  // 탭 변경 핸들러
  const handleTabChange = (type: DocumentType) => {
    setSelectedType(type);
    // 탭 변경 시 첫 페이지로 이동하고 체크박스 초기화, 검색어 초기화
    setCurrentPage(1);
    setAllChecked(false);
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
          <SearchDeleteTable
            checkedCount={checkedCount}
            deleteButtonText={getDeleteButtonText()}
            onDelete={() => setIsDeleteModalOpen(true)}
            onCancel={() => setAllChecked(false)}
            onSearch={(query) => {
              setSearchQuery(query);
              setCurrentPage(1); // 검색 시 첫 페이지로 이동
            }}
            searchKeyword={searchQuery}
            hasDeleteButton={false} // 문서함에서는 무조건 삭제 버튼 없음
          />
          {(isTaxDocument && isTaxDataLoading) ||
          (isTransactionDocument && isProjectDataLoading) ? (
            <div className="flex justify-center items-center h-100">
              <Spinner />
            </div>
          ) : (
            <DocumentTable
              data={currentData}
              onDocumentClick={
                isTaxDocument || isTransactionDocument
                  ? () => {}
                  : handleDocumentClick
              }
              isAllChecked={isAllChecked}
              onToggleAll={toggleAll}
              isChecked={isChecked}
              toggleOne={toggleOne}
              selectedType={selectedType}
              // 세금계산서
              onTaxSortChange={(field, direction) => {
                setTaxSortField(field);
                setTaxSortDirection(direction);
                setCurrentPage(1); // 정렬 변경 시 첫 페이지로 이동
              }}
              taxSortField={taxSortField}
              taxSortDirection={taxSortDirection}
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

      {/* 판넬 */}
      {selectedDocument && selectedDocument.documentType === '주문서' && (
        <Panel title="주문서" onClose={() => setSelectedDocument(null)}>
          <OrderDocumentView
            documentTitle={'주문서'}
            clientData={{
              name: '플라스틱이 좋아',
              business_registration_number: '123-45-67890',
              representative_name: '플라스틱',
              email: 'plastic@gmail.com',
              phone: '010-1234-5678',
              fax: '02-123-4567',
              business_type: '소프트웨어',
              business_category: '소프트웨어',
              address: '서울시 강남구 역삼동',
            }}
            dueDate={'2025-08-01'}
            productListInfoTitle={'상품 목록'}
            productItems={[
              {
                productId: 1,
                product_code: '1234567890',
                product_name: '플라스틱',
                spec: '100x100x100',
                unit: '개',
                quantity: 10,
                unit_price: 50000,
                supply_amount: 500000,
                tax_amount: 50000,
              },
            ]}
            supplyAmount={500000}
          />
        </Panel>
      )}
      {selectedDocument && selectedDocument.documentType === '생산지시서' && (
        <Panel title="생산지시서" onClose={() => setSelectedDocument(null)}>
          <ProductionDocumentView todayProductionPlans={[]} />
        </Panel>
      )}

      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
        />
      )}
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
