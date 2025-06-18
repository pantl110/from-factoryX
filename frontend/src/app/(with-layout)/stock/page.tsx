"use client";

import { useState } from "react";
import MainTitleSec from "./main-title-sec";
import Product from "./product/index";
import Material from "./material/index";
import { StockTabType } from "./types";

const StockPage = () => {
  const [selectedTab, setSelectedTab] = useState<StockTabType>("product");

  const handleTabChange = (tab: StockTabType) => {
    setSelectedTab(tab);
  };

  return (
    <div className="flex flex-col gap-8">
      <MainTitleSec selectedTab={selectedTab} onTabChange={handleTabChange} />
      <div className="px-8">
        {selectedTab === "product" ? <Product /> : <Material />}
      </div>
    </div>
  );
};

export default StockPage;
