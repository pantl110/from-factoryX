"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import Product from "./product/index";
import Material from "./material/index";
import { StockTabType } from "./types";
import ProductAddDropdown from "./product/modals/product-add-dropdown";
import ExcelUploadModal from "./product/modals/excel-upload-modal";

const StockPage = () => {
  const [selectedTab, setSelectedTab] = useState<StockTabType>("product");
  const [isProductAddDropdownOpen, setIsProductAddDropdownOpen] =
    useState(false);
  const [isMaterialAddDropdownOpen, setIsMaterialAddDropdownOpen] =
    useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isCreatePanelOpen, setIsCreatePanelOpen] = useState(false);

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
    </>
  );
};

export default StockPage;
