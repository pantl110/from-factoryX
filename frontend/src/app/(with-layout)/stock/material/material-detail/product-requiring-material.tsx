import ProductRequiringMaterialItem from "./product-requiring-material-item";

const ProductRequiringMaterial = () => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
        <p className="flex-1 py-1 px-3 text-sv">품목명</p>
        <p className="flex-1 py-1 px-3 text-sv">품목 코드</p>
        <p className="flex-1 py-1 px-3 text-sv">규격</p>
        <p className="w-[80px] py-1 px-3 text-sv">단위</p>
      </div>
      <ProductRequiringMaterialItem
        productName="투명 아크릴판"
        productCode="PRM-011"
        size="100x300mm"
        unit="EA"
      />
      <ProductRequiringMaterialItem
        productName="LED 조립 키트"
        productCode="PRM-012"
        size="10mm"
        unit="EA"
      />
      <ProductRequiringMaterialItem
        productName="스마트리모콘"
        productCode="PRM-013"
        size="250x180mm"
        unit="EA"
      />
    </div>
  );
};

export default ProductRequiringMaterial;
