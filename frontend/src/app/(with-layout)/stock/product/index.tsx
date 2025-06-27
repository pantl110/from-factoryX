"use client";

import TableHeader from "./table-header";
import TableItem from "./table-item";
import { productData } from "@/mocks/product-data";
import { useState } from "react";
import ProductDetail from "./product-detail";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import { useDeleteMode } from "@/hooks/use-delete-mode";
import DeleteModal from "@/ui/modal/delete-modal";
import { ProductDataModel } from "@/types/data-model";

interface ProductProps {
  isCreatePanelOpen: boolean;
  setIsCreatePanelOpen: (isOpen: boolean) => void;
}

const Product = ({ isCreatePanelOpen, setIsCreatePanelOpen }: ProductProps) => {
  const {
    isDeleteMode,
    isDeleteModalOpen,
    toggleDeleteMode,
    closeDeleteModal,
  } = useDeleteMode();

  const [selectedProduct, setSelectedProduct] =
    useState<ProductDataModel | null>(null);

  const handleItemClick = (product: ProductDataModel) => {
    setSelectedProduct(product);
  };
  const handlePanelClose = () => {
    setSelectedProduct(null);
    setIsCreatePanelOpen(false);
  };

  const isPanelOpen = selectedProduct !== null || isCreatePanelOpen;
  const mode = isCreatePanelOpen ? "create" : "view";

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput />
        <MiniBtn
          text="삭제"
          textColor={isDeleteMode ? "text-red" : "text-dg"}
          borderColor={isDeleteMode ? "border-none" : "border-lg"}
          bgColor={isDeleteMode ? "bg-red-8" : "bg-wh"}
          hoverColor={isDeleteMode ? "hover:bg-red-hover" : "hover:bg-bg"}
          onClick={toggleDeleteMode}
        />
      </div>

      <div>
        <TableHeader isDeleteMode={isDeleteMode} />
        {productData.map((item) => (
          <TableItem
            key={item.id}
            productName={item.productName}
            productCode={item.productCode ?? ""}
            size={item.size ?? ""}
            unit={item.unit ?? ""}
            stock={item.stock ?? 0}
            onClick={() => handleItemClick(item)}
            isDeleteMode={isDeleteMode}
          />
        ))}
      </div>

      {isPanelOpen && (
        <ProductDetail
          key={selectedProduct?.id || "create"}
          product={selectedProduct}
          onClose={handlePanelClose}
          mode={mode}
        />
      )}
      {isDeleteModalOpen && <DeleteModal onClose={closeDeleteModal} />}
    </>
  );
};

export default Product;
