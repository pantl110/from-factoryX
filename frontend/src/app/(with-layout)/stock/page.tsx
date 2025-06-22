"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import Product from "./product/index";
import Material from "./material/index";
import { StockTabType } from "./types";
import ProductAddDropdown from "./product/modals/product-add-dropdown";

const StockPage = () => {
  const [selectedTab, setSelectedTab] = useState<StockTabType>("product");
  const [isProductAddDropdownOpen, setIsProductAddDropdownOpen] =
    useState(false);
  const [isMaterialAddDropdownOpen, setIsMaterialAddDropdownOpen] =
    useState(false);

  const handleTabChange = (tab: StockTabType) => {
    setSelectedTab(tab);
  };

  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        onProductAddDropdownOpen={setIsProductAddDropdownOpen}
        isProductAddDropdownOpen={isProductAddDropdownOpen}
        onMaterialAddDropdownOpen={setIsMaterialAddDropdownOpen}
        isMaterialAddDropdownOpen={isMaterialAddDropdownOpen}
      />
      <div className="px-8">
        {selectedTab === "product" ? <Product /> : <Material />}
      </div>
    </div>
  );
};

export default StockPage;
