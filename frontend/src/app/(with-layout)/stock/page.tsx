"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MainTitleSec from "./main-title-sec";
import Product from "./product/index";
import Material from "./material/index";
import { StockTabType } from "./types";
import ExcelUploadModal from "./modals/excel-upload-modal";
import ClientInfoModal from "./material/modals/client-info-modal";
import usePageStatusStore from "@/store/page-status-store";
import MaterialEnrollmentModal from "./material/modals/material-enrollment-modal";
import Panel from "@/ui/panel";
import MaterialDetail from "./material/material-detail";
import CustomerInfoModal from "./material/modals/customer-info-modal";
import ProductEnrollmentModal from "./material/modals/product-enrollment-modal";

const StockPageContent = () => {
  const stockTab =
    (usePageStatusStore((state) => state.stockTab) as StockTabType) || null;
  const setStockTab = usePageStatusStore((state) => state.setStockTab);
  const searchParams = useSearchParams();

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "material") {
      setStockTab("material");
    } else if (!stockTab) {
      setStockTab("product");
    }
  }, [stockTab, setStockTab, searchParams]);

  const [isProductAddDropdownOpen, setIsProductAddDropdownOpen] =
    useState(false);
  const [isMaterialAddDropdownOpen, setIsMaterialAddDropdownOpen] =
    useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isClientInfoModalOpen, setIsClientInfoModalOpen] = useState(false);
  const [isMaterialEnrollmentModalOpen, setIsMaterialEnrollmentModalOpen] =
    useState(false);
  const [isMaterialDetailOpen, setIsMaterialDetailOpen] = useState(false);
  const [isCustomerInfoModalOpen, setIsCustomerInfoModalOpen] = useState(false);
  const [isProductEnrollmentModalOpen, setIsProductEnrollmentModalOpen] =
    useState(false);

  const handleTabChange = (tab: StockTabType) => {
    setStockTab(tab);
  };
  const handleOpenExcelModal = () => {
    setIsProductAddDropdownOpen(false);
    setIsExcelModalOpen(true);
  };
  const handleOpenCreatePanel = () => {
    setIsProductAddDropdownOpen(false);
    setIsCreatePanelOpen(true);
  };
  const handleOpenClientInfoModal = () => {
    setIsMaterialAddDropdownOpen(false);
    setIsClientInfoModalOpen(true);
  };
  const handleNextClientInfo = () => {
    setIsClientInfoModalOpen(false);
    setIsMaterialEnrollmentModalOpen(true);
  };
  const handleMaterialRegister = () => {
    setIsMaterialEnrollmentModalOpen(false);
    setIsMaterialDetailOpen(true);
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
        <div className="px-8">
          {stockTab === "product" ? (
            <Product
              isCreatePanelOpen={isCreatePanelOpen}
              setIsCreatePanelOpen={setIsCreatePanelOpen}
            />
          ) : (
            <Material setIsMaterialDetailOpen={setIsMaterialDetailOpen} />
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
      {isMaterialEnrollmentModalOpen && (
        <MaterialEnrollmentModal
          onClose={() => setIsMaterialEnrollmentModalOpen(false)}
          onRegister={handleMaterialRegister}
        />
      )}
      {isMaterialDetailOpen && (
        <Panel
          title="원자재 재고관리"
          onClose={() => setIsMaterialDetailOpen(false)}
        >
          <MaterialDetail
            setIsCustomerInfoModalOpen={setIsCustomerInfoModalOpen}
            setIsProductEnrollmentModalOpen={setIsProductEnrollmentModalOpen}
          />
        </Panel>
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
    <Suspense fallback={<div>Loading...</div>}>
      <StockPageContent />
    </Suspense>
  );
};

export default StockPage;
