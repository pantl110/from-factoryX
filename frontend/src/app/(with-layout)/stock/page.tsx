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
import Panel from '@/ui/panel';
import MaterialDetail, { MaterialInfoModel } from './material/material-detail';
import CustomerInfoModal from './material/modals/customer-info-modal';
import ProductEnrollmentModal from './material/modals/product-enrollment-modal';
import Spinner from '@/ui/spinner';
import StockLocationUploadModal from './modals/stock-location-upload-modal';
import { ClientModel } from '@/types/data-model';
import MiniBtn from '@/ui/mini-btn';
import { useRef } from 'react';
import { useUpdateMaterial } from '@/hooks';
import { useMaterialReloadStore } from '@/store/material-reload-store';

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

  const [isProductAddDropdownOpen, setIsProductAddDropdownOpen] =
    useState(false);
  const [isMaterialAddDropdownOpen, setIsMaterialAddDropdownOpen] =
    useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  // 품목 추가 버튼
  const [productSetSelectedProductId, setProductSetSelectedProductId] =
    useState<((id: number | null) => void) | null>(null);
  // 자재 추가 버튼
  // const [materialSetSelectedMaterialId, setMaterialSetSelectedMaterialId] =
  //   useState<((id: number | null) => void) | null>(null);
  const [isClientInfoModalOpen, setIsClientInfoModalOpen] = useState(false);
  const [isMaterialEnrollmentModalOpen, setIsMaterialEnrollmentModalOpen] =
    useState(false);
  // 자재 디테일 판넬 관련 상태
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);
  const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(
    null
  ); // 선택한 자재 정보를 판넬에서 보여주기
  const [isMaterialDetailDirty, setIsMaterialDetailDirty] = useState(false); // 원자재 디테일 판넬 수정 상태
  //
  const [isCustomerInfoModalOpen, setIsCustomerInfoModalOpen] = useState(false);
  const [isProductEnrollmentModalOpen, setIsProductEnrollmentModalOpen] =
    useState(false);
  // 품목 디테일 판넬 상태
  const [isProductDetailPanelOpen, setIsProductDetailPanelOpen] =
    useState(false);
  const [clientInfo, setClientInfo] = useState<ClientModel | null>(null);

  const [stockLocationCount, setStockLocationCount] = useState(1);
  const [openUploadModals, setOpenUploadModals] = useState<boolean[]>([false]);

  // 원자재 재고 위치 관련 상태
  const handleAddStockLocation = () => {
    setStockLocationCount((prev) => prev + 1);
    setOpenUploadModals((prev) => [...prev, false]);
  };
  const handleDeleteStockLocation = (index: number) => {
    setStockLocationCount((prev) => Math.max(1, prev - 1));
    setOpenUploadModals((prev) => prev.filter((_, i) => i !== index));
  };
  const handleOpenUploadModal = (index: number) => {
    setOpenUploadModals((prev) =>
      prev.map((open, i) => (i === index ? true : open))
    );
  };
  const handleCloseUploadModal = (index: number) => {
    setOpenUploadModals((prev) =>
      prev.map((open, i) => (i === index ? false : open))
    );
  };

  // 탭 변경
  const handleTabChange = (tab: StockTabType) => {
    setStockTab(tab);
  };
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
  // 원자재 디테일 판넬의 저장 버튼 클릭 시 수정사항 반영
  const materialDetailRef = useRef<MaterialInfoModel>(null);
  const { updateMaterial } = useUpdateMaterial();
  const { setShouldReload } = useMaterialReloadStore();
  const handleSaveMaterialDetail = async () => {
    if (!selectedMaterialId) return;
    const values = materialDetailRef.current?.getValues();
    if (!values) return;
    // Only update currentStock and minStock
    const payload: Record<string, number> = {};
    if (values.currentStock !== undefined && values.currentStock !== '') {
      payload.current_stock = Number(values.currentStock);
    }
    if (values.minStock !== undefined && values.minStock !== '') {
      payload.standard_stock = Number(values.minStock);
    }
    if (Object.keys(payload).length === 0) {
      return;
    }
    const result = await updateMaterial(selectedMaterialId, payload);
    if (result && result.success) {
      setShouldReload(true); // 원자재 목록 렌더링
      setIsMaterialDetailOpen(false); // 판넬 닫기
    } else {
      alert(result?.error || '원자재 수정에 실패했습니다.');
    }
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
              setSelectedMaterialId={setSelectedMaterialId}
            />
          )}
        </div>
      </div>

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
      {isMaterialDetailOpen && selectedMaterialId && (
        <Panel
          title="원자재 재고관리"
          onClose={() => setIsMaterialDetailOpen(false)}
          headerButton={
            isMaterialDetailDirty && (
              <MiniBtn
                text="저장"
                onClick={handleSaveMaterialDetail}
                hoverColor="hover:bg-secondary-hover"
                textColor="text-primary"
                bgColor="bg-primary-8"
              />
            )
          }
        >
          <MaterialDetail
            ref={materialDetailRef}
            materialId={selectedMaterialId}
            setIsCustomerInfoModalOpen={setIsCustomerInfoModalOpen}
            setIsProductEnrollmentModalOpen={setIsProductEnrollmentModalOpen}
            stockLocationCount={stockLocationCount}
            handleAddStockLocation={handleAddStockLocation}
            handleDeleteStockLocation={handleDeleteStockLocation}
            handleOpenUploadModal={handleOpenUploadModal}
            onIsDirtyChange={setIsMaterialDetailDirty}
          />
        </Panel>
      )}
      {openUploadModals.map((open, idx) =>
        open ? (
          <StockLocationUploadModal
            key={idx}
            onClose={() => handleCloseUploadModal(idx)}
          />
        ) : null
      )}
      {/* MaterialDetail의 거래처 정보 상세보기 모달 */}
      {isCustomerInfoModalOpen && (
        <CustomerInfoModal onClose={() => setIsCustomerInfoModalOpen(false)} />
      )}
      {/* MaterialDetail의 추가하기 버튼 모달 */}
      {isProductEnrollmentModalOpen && (
        <ProductEnrollmentModal
          onClose={() => setIsProductEnrollmentModalOpen(false)}
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
