"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import Product from "./product/index";
import Material from "./material/index";
import { StockTabType } from "./types";
import ExcelUploadModal from "./product/modals/excel-upload-modal";
import ClientInfoModal from "./material/modals/client-info-modal";
import MaterialEnrollment from "./material/modals/material-enrollment";

const StockPage = () => {
  const [selectedTab, setSelectedTab] = useState<StockTabType>("product");
  const [isProductAddDropdownOpen, setIsProductAddDropdownOpen] =
    useState(false);
  const [isMaterialAddDropdownOpen, setIsMaterialAddDropdownOpen] =
    useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);
  const [isClientInfoModalOpen, setIsClientInfoModalOpen] = useState(false);
  const [isMaterialEnrollmentOpen, setIsMaterialEnrollmentOpen] =
    useState(false);

  const handleTabChange = (tab: StockTabType) => {
    setSelectedTab(tab);
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
    setIsMaterialEnrollmentOpen(true);
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <MainTitleSec
          selectedTab={selectedTab}
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
          {selectedTab === "product" ? (
            <Product
              isCreatePanelOpen={isCreatePanelOpen}
              setIsCreatePanelOpen={setIsCreatePanelOpen}
            />
          ) : (
            <Material />
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
      {isMaterialEnrollmentOpen && (
        <MaterialEnrollment
          onClose={() => setIsMaterialEnrollmentOpen(false)}
        />
      )}
    </>
  );
};

export default StockPage;
