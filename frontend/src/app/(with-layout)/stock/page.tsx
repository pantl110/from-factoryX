'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MainTitleSec from './main-title-sec';
import Product from './product/index';
import Material from './material/index';
import { StockTabType } from './types';
import ExcelUploadModal from './modals/excel-upload-modal';
import ClientInfoModal from './material/modals/client-info-modal';
import usePageStatusStore from '@/store/page-status-store';
import MaterialEnrollmentModal from './material/modals/material-enrollment-modal';
import Spinner from '@/ui/spinner';
import { ClientModel } from '@/types/data-model';

const StockPageContent = () => {
  const stockTab = usePageStatusStore((state) => state.stockTab);
  const setStockTab = usePageStatusStore((state) => state.setStockTab);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'material') {
      setStockTab('material');
    }
  }, [setStockTab, searchParams]);

  // 품목 추가, 자재 추가 드랍다운 상태
  const [isProductAddDropdownOpen, setIsProductAddDropdownOpen] =
    useState(false);
  const [isMaterialAddDropdownOpen, setIsMaterialAddDropdownOpen] =
    useState(false);

  // 품목 추가, 자채추가 엑셀 업로드 모달 상태
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // 품목 추가 버튼
  const [productSetSelectedProductId, setProductSetSelectedProductId] =
    useState<((id: number | null) => void) | null>(null);
  // 자재 추가 버튼
  const [isClientInfoModalOpen, setIsClientInfoModalOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientModel | null>(null); // 자재 추가 시 저장해 둘 거래처 정보
  const [isMaterialEnrollmentModalOpen, setIsMaterialEnrollmentModalOpen] =
    useState(false);

  // 디테일 판넬 상태
  const [isProductDetailPanelOpen, setIsProductDetailPanelOpen] =
    useState(false); // 품목 디테일 판넬 상태
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false); // 자재 디테일 판넬 상태

  // 탭 변경
  const handleTabChange = (tab: StockTabType) => {
    setStockTab(tab);
  };

  // 품목 추가, 자재 추가 관련 함수
  const handleOpenExcelModal = () => {
    setIsProductAddDropdownOpen(false);
    setIsExcelModalOpen(true);
  };
  const handleOpenCreatePanel = () => {
    setIsProductAddDropdownOpen(false);
    if (productSetSelectedProductId) {
      productSetSelectedProductId(null);
    }
    setIsProductDetailPanelOpen(true);
  };
  const handleOpenClientInfoModal = () => {
    setIsMaterialAddDropdownOpen(false);
    setIsClientInfoModalOpen(true);
  };
  const handleNextClientInfo = (info: ClientModel) => {
    setClientInfo(info);
    setIsClientInfoModalOpen(false);
    setIsMaterialEnrollmentModalOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          selectedTab={stockTab}
          onTabChange={handleTabChange}
          onProductAddDropdownOpen={setIsProductAddDropdownOpen}
          isProductAddDropdownOpen={isProductAddDropdownOpen}
          onMaterialAddDropdownOpen={setIsMaterialAddDropdownOpen}
          isMaterialAddDropdownOpen={isMaterialAddDropdownOpen}
          onOpenExcelModal={handleOpenExcelModal}
          onOpenCreatePanel={handleOpenCreatePanel}
          onOpenClientInfoModal={handleOpenClientInfoModal}
        />
        <div className="px-10 pb-10">
          {stockTab === 'product' ? (
            <Product
              setSelectedProductIdToParent={setProductSetSelectedProductId}
              isProductDetailPanelOpen={isProductDetailPanelOpen}
              setIsProductDetailPanelOpen={setIsProductDetailPanelOpen}
            />
          ) : (
            <Material
              setIsMaterialDetailOpen={setIsMaterialDetailOpen}
              isMaterialDetailOpen={isMaterialDetailOpen}
            />
          )}
        </div>
      </div>

      {/* 품목 추가, 자재 추가 관련 모달 */}
      {isExcelModalOpen && (
        <ExcelUploadModal onClose={() => setIsExcelModalOpen(false)} />
      )}
      {isClientInfoModalOpen && (
        <ClientInfoModal
          onClose={() => setIsClientInfoModalOpen(false)}
          onNext={handleNextClientInfo}
        />
      )}
      {isMaterialEnrollmentModalOpen && clientInfo && (
        <MaterialEnrollmentModal
          clientInfo={clientInfo}
          onClose={() => setIsMaterialEnrollmentModalOpen(false)}
        />
      )}
    </>
  );
};

const StockPage = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <Spinner />
        </div>
      }
    >
      <StockPageContent />
    </Suspense>
  );
};

export default StockPage;
