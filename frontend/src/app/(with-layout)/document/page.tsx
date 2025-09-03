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
import TransactionDocumentView from './transaction-document-view';
import Spinner from '@/ui/spinner';
import { useCheckAll } from '@/hooks/use-check-all';
import DeleteModal from '@/ui/modal/delete-modal';
import { useGetPublishedTaxInvoices } from '@/hooks';
import { PublishedTaxInvoiceResponseModel } from '@/types/data-model';

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
  // 세금계산서 데이터 상태
  const [taxInvoices, setTaxInvoices] = useState<
    PublishedTaxInvoiceResponseModel[]
  >([]);
  const [taxInvoicesTotalPages, setTaxInvoicesTotalPages] = useState(0);

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
          setTaxInvoicesTotalPages(result.data.pageCnt || 1);
        }
      };

      fetchTaxData();
    }
  }, [
    selectedType,
    currentPage,
    debouncedSearchQuery,
    taxSortField,
    taxSortDirection,
    getPublishedTaxInvoices,
  ]);

  // 현재 표시할 데이터 결정
  const isTaxDocument =
    selectedType === '매출 세금계산서' || selectedType === '매입 세금계산서';
  const currentData = isTaxDocument ? taxInvoices : filteredData;
  const totalPages = isTaxDocument
    ? taxInvoicesTotalPages
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
  } = useCheckAll(currentData.map((item) => item.id));

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
            hasData={currentData.length > 0}
            hasDeleteButton={!isTaxDocument}
          />
          {isTaxDocument && isTaxDataLoading ? (
            <div className="flex justify-center items-center h-100">
              <Spinner />
            </div>
          ) : (
            <DocumentTable
              data={currentData}
              onDocumentClick={isTaxDocument ? () => {} : handleDocumentClick}
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
      {selectedDocument && selectedDocument.documentType === '거래명세서' && (
        <Panel title="거래명세서" onClose={() => setSelectedDocument(null)}>
          <TransactionDocumentView
            quotationData={{
              id: 1,
              client: 1,
              created_at: '2025-01-01T00:00:00Z',
              due_date: '2025-08-01',
              due_date_notice: false,
              factory: 1,
              project: 1,
              type: 'quotation',
              updated_at: '2025-01-01T00:00:00Z',
              uploaded_file: '',
              client_info: {
                id: 1,
                name: '플라스틱이 좋아',
                business_registration_number: '123-45-67890',
                representative_name: '플라스틱',
                factory: 1,
                type: 'customer' as const,
                email: 'plastic@gmail.com',
                phone: '010-1234-5678',
                fax: '02-123-4567',
                business_type: '소프트웨어',
                business_category: '소프트웨어',
                address: '서울시 강남구 역삼동',
                manager: '플라스틱',
              },
              factory_info: {
                id: 1,
                name: '플라스틱이 좋아',
                business_registration_number: '123-45-67890',
                representative_name: '플라스틱',
                owner: 1,
                manager_email: 'plastic@gmail.com',
                manager_phone: '010-1234-5678',
                manager_fax: '02-123-4567',
                business_type: '소프트웨어',
                business_category: '소프트웨어',
                business_address: '서울시 강남구 역삼동',
                is_trial: false,
                billing_key: '1234567890',
              },
              products_info: [
                {
                  id: 1,
                  code: '1234567890',
                  name: '플라스틱',
                  spec: '100x100x100',
                  unit: '개',
                  quantity: 10,
                  unit_price: 50000,
                  total_price: 500000,
                  quotation_product_id: 1,
                },
              ],
            }}
            startDate={'2025-08-01'}
          />
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
