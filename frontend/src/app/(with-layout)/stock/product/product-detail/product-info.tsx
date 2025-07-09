import { productData } from "@/mocks/product-data";
import { ProductDataModel } from "@/types/data-model";
import { ProductNameDropdown } from "@/ui/dropdown/product-name-dropdown";
import InfoLabelValue from "@/ui/info-label-value";
import { useEffect } from "react";
import { useDropdownFilter } from "@/hooks/use-dropdown-filter";

interface ProductInfoProps {
  product: ProductDataModel;
  isEditable?: boolean;
  onValueChange?: (value: Partial<ProductDataModel>) => void;
  onClick?: () => void;
}

const ProductInfo = ({
  product,
  isEditable = false,
  onValueChange,
  onClick,
}: ProductInfoProps) => {
  // useDropdownFilter 훅 사용
  const {
    input: productName,
    setInput: setProductName,
    isOpen: isProductNameDropdownOpen,
    setIsOpen: setIsProductNameDropdownOpen,
    filtered: matchedItems,
    handleInputChange,
    handleSelect,
  } = useDropdownFilter(productData, (item) => item.productName);

  // product prop이 바뀌면 productName도 동기화
  useEffect(() => {
    setProductName(product.productName || "");
  }, [product.productName, setProductName]);

  // 드롭다운에서 선택 시 onValueChange도 호출
  const handleSelectProduct = (item: ProductDataModel) => {
    handleSelect(item);
    if (onValueChange) {
      onValueChange({
        productName: item.productName,
        productCode: item.productCode,
        size: item.size,
        unit: item.unit,
        stock: item.stock,
        productionTime: item.productionTime,
        location: item.location,
        comment: item.comment,
      });
    }
  };

  return (
    <div className="flex flex-col border-b border-lg">
      <div className="flex relative">
        <InfoLabelValue
          label="품목명"
          value={productName}
          isEditing={isEditable}
          placeholder="(필수) 품목명을 입력하세요."
          onChange={(e) => {
            handleInputChange(e as React.ChangeEvent<HTMLInputElement>);
            if (onValueChange) onValueChange({ productName: e.target.value });
          }}
          onFocus={(
            e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
          ) => {
            if (e.target.value && matchedItems.length > 0)
              setIsProductNameDropdownOpen(true);
          }}
          onBlur={() =>
            setTimeout(() => setIsProductNameDropdownOpen(false), 150)
          }
          required
        />
        {isProductNameDropdownOpen && matchedItems.length > 0 && (
          <div className="absolute left-[134px] top-12 z-10">
            <ProductNameDropdown
              items={matchedItems}
              onSelect={handleSelectProduct}
              width="w-[326px]"
            />
          </div>
        )}
        <InfoLabelValue
          label="품목 코드"
          required
          value={product.productCode}
          isEditing={isEditable}
          placeholder="(필수) 품목 코드를 입력하세요."
        />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="규격"
          required
          value={product.size}
          isEditing={isEditable}
          placeholder="(필수) 규격을 입력하세요."
        />
        <InfoLabelValue
          label="단위"
          required
          value={product.unit}
          isEditing={isEditable}
          placeholder="(필수) 단위를 입력하세요."
        />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="현재 재고"
          value={
            product.stock === -1 || product.stock === undefined
              ? ""
              : product.stock.toLocaleString()
          }
          isEditing={isEditable}
          placeholder="현재 재고 수량을 입력하세요."
          inputType="number"
          onChange={(e) => {
            const value = e.target.value.replace(/[^0-9]/g, "");
            if (onValueChange) onValueChange({ stock: Number(value) });
          }}
        />
        <InfoLabelValue
          label="평균 생산 시간"
          value={
            isEditable
              ? product.productionTime
              : product.productionTime
                ? `${product.productionTime}`
                : "-"
          }
          isEditing={isEditable}
          placeholder="-"
          inputType="number"
          onChange={(e) => {
            // 숫자만 허용
            const value = e.target.value.replace(/[^0-9]/g, "");
            if (onValueChange) onValueChange({ productionTime: value });
          }}
        />
      </div>
      <InfoLabelValue
        label="특이사항"
        value={
          product.comment && product.comment.length > 0 ? (
            <ul>
              {product.comment.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : isEditable ? ( // 편집 중이면 빈 값, 아니면 "-"
            ""
          ) : (
            "-"
          )
        }
        isEditing={isEditable}
        textarea={true}
        placeholder="특이사항 입력"
      />

      {/* lint 오류 해결 위한 임시 버튼 */}
      <button onClick={onClick} className="hidden">
        품목 수정
      </button>
    </div>
  );
};

export default ProductInfo;
