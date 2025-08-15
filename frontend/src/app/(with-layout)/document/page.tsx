'use client';

import { useState, Suspense } from 'react';
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
import TaxDocumentView from './tax-document-view';
import Spinner from '@/ui/spinner';
import { useCheckAll } from '@/hooks/use-check-all';
import DeleteModal from '@/ui/modal/delete-modal';
import usePagination from '@/hooks/use-pagination';

const DocumentPageContent = () => {
  const [selectedType, setSelectedType] = useState<DocumentType>('주문서');
  const [selectedDocument, setSelectedDocument] =
    useState<DocumentDataModel | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const filteredData = documentData.filter(
    (item) => item.documentType === selectedType
  );

  const {
    currentItems: pagedData,
    currentPage,
    totalPages,
    setCurrentPage,
  } = usePagination({ items: filteredData, itemsPerPage: 10 });

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(pagedData.map((item) => item.id));

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
    // 탭 변경 시 첫 페이지로 이동하고 체크박스 초기화
    setCurrentPage(1);
    setAllChecked(false);
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
          />
          <DocumentTable
            data={pagedData}
            onDocumentClick={handleDocumentClick}
            isAllChecked={isAllChecked}
            onToggleAll={toggleAll}
            isChecked={isChecked}
            toggleOne={toggleOne}
            selectedType={selectedType}
          />
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
          <ProductionDocumentView />
        </Panel>
      )}
      {selectedDocument && selectedDocument.documentType === '거래명세서' && (
        <Panel title="거래명세서" onClose={() => setSelectedDocument(null)}>
          <TransactionDocumentView
            quotationData={{
              factory_name: '플라스틱이 좋아',
              business_registration_number: '123-45-67890',
              representative_name: '플라스틱',
              email: 'plastic@gmail.com',
              phone: '010-1234-5678',
              fax: '02-123-4567',
              business_type: '소프트웨어',
              business_category: '소프트웨어',
              address: '서울시 강남구 역삼동',
              products: [
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
              ],
              due_date: '2025-08-01',
            }}
            startDate={'2025-08-01'}
          />
        </Panel>
      )}
      {selectedDocument &&
        selectedDocument.documentType === '매출 세금계산서' && (
          <Panel
            title="매출 세금계산서"
            onClose={() => setSelectedDocument(null)}
          >
            <TaxDocumentView taxType="sales" />
          </Panel>
        )}
      {selectedDocument &&
        selectedDocument.documentType === '매입 세금계산서' && (
          <Panel
            title="매입 세금계산서"
            onClose={() => setSelectedDocument(null)}
          >
            <TaxDocumentView taxType="purchase" />
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
