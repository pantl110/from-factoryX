'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
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
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import useToast from '@/hooks/use-toast';

const StockPageContent = () => {
  const stockTab = usePageStatusStore((state) => state.stockTab);
  const setStockTab = usePageStatusStore((state) => state.setStockTab);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'material') {
      setStockTab('material');
    } else if (tabParam === 'product' || tabParam === null) {
      setStockTab('product');
    }
  }, [setStockTab, searchParams]);

  // 제품 추가, 자재 추가 드랍다운 상태
  const [isProductAddDropdownOpen, setIsProductAddDropdownOpen] =
    useState(false);
  const [isMaterialAddDropdownOpen, setIsMaterialAddDropdownOpen] =
    useState(false);

  // 제품 추가, 자채추가 엑셀 업로드 모달 상태
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // 제품 추가 버튼
  const [productSetSelectedProductId, setProductSetSelectedProductId] =
    useState<((id: number | null) => void) | null>(null);
  // 자재 추가 버튼
  const [isClientInfoModalOpen, setIsClientInfoModalOpen] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientModel | null>(null); // 자재 추가 시 저장해 둘 거래처 정보
  const [clientId, setClientId] = useState<number | null>(null); // 자재 추가 시 저장해 둘 거래처 ID
  const [isMaterialEnrollmentModalOpen, setIsMaterialEnrollmentModalOpen] =
    useState(false);

  // 제품 엑셀 업로드 후 새로고침 함수
  const productReloadRef = useRef<(() => void) | null>(null);
  const materialReloadRef = useRef<(() => void) | null>(null);

  // 토스트 훅 사용
  const { isToastOpen, isVisible, showToast } = useToast();

  // 중복 코드 토스트 훅
  const {
    isToastOpen: isDuplicateToastOpen,
    isVisible: isDuplicateToastVisible,
    showToast: showDuplicateToast,
  } = useToast();

  // 디테일 판넬 상태
  const [isProductDetailPanelOpen, setIsProductDetailPanelOpen] =
    useState(false); // 제품 디테일 판넬 상태
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false); // 자재 디테일 판넬 상태

  // 탭 변경
  const handleTabChange = (tab: StockTabType) => {
    setStockTab(tab);
  };

  // 제품 추가, 자재 추가 관련 함수
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
  const handleNextClientInfo = (info: ClientModel, id?: number | null) => {
    setClientInfo(info);
    setClientId(id || null);
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
              setReloadFunctionToParent={(fn) =>
                (productReloadRef.current = fn)
              }
              isProductDetailPanelOpen={isProductDetailPanelOpen}
              setIsProductDetailPanelOpen={setIsProductDetailPanelOpen}
            />
          ) : (
            <Material
              setIsMaterialDetailOpen={setIsMaterialDetailOpen}
              isMaterialDetailOpen={isMaterialDetailOpen}
              setReloadFunctionToParent={(fn) =>
                (materialReloadRef.current = fn)
              }
            />
          )}
        </div>
      </div>

      {/* 제품 추가, 자재 추가 관련 모달 */}
      {isExcelModalOpen && (
        <ExcelUploadModal
          type={stockTab}
          onClose={() => setIsExcelModalOpen(false)}
          onSuccess={(hasDuplicates) => {
            // 리로드 함수 호출
            if (stockTab === 'product' && productReloadRef.current) {
              productReloadRef.current();
            }
            if (stockTab === 'material' && materialReloadRef.current) {
              materialReloadRef.current();
            }

            // 중복 코드가 있으면 토스트 표시
            if (hasDuplicates) {
              showDuplicateToast();
            }
          }}
        />
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
          clientId={clientId}
          onClose={() => setIsMaterialEnrollmentModalOpen(false)}
          showToast={showToast}
        />
      )}

      {/* 자재 코드 겹치면 토스트 */}
      {isToastOpen && (
        <Toast
          text="이미 존재하는 자재코드에요."
          subtext="다른 자재코드로 수정해주세요."
          type="red"
          isVisible={isVisible}
          icon={<WarningCircle size={20} />}
        />
      )}

      {/* 중복 코드 토스트 */}
      {isDuplicateToastOpen && (
        <Toast
          text={
            stockTab === 'product'
              ? '중복된 제품 코드는 등록되지 않았습니다.'
              : '중복된 자재 코드는 등록되지 않았습니다.'
          }
          subtext=""
          type="red"
          isVisible={isDuplicateToastVisible}
          icon={<WarningCircle size={20} className="text-red" />}
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
