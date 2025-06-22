"use client";

import SearchDeleteTable from "@/ui/search-delete-table";
import TableHeader from "./table-header";
import TableItem from "./table-item";
import { productData, ProductDataModel } from "@/mocks/product-data";
import { useState } from "react";
import ProductDetail from "./product-detail";

const Product = () => {
  const [selectedProduct, setSelectedProduct] =
    useState<ProductDataModel | null>(null);

  const handleItemClick = (product: ProductDataModel) => {
    setSelectedProduct(product);
  };
  const handlePanelClose = () => {
    setSelectedProduct(null);
  };

  return (
    <>
      <SearchDeleteTable />
      <div>
        <TableHeader />
        {productData.map((item) => (
          <TableItem
            key={item.id}
            productName={item.productName}
            productCode={item.productCode}
            size={item.size}
            unit={item.unit}
            stock={item.stock}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>

      {selectedProduct && (
        <ProductDetail product={selectedProduct} onClose={handlePanelClose} />
      )}
    </>
  );
};

export default Product;
