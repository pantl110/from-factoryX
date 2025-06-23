import { ProductDataModel } from "@/mocks/product-data";
import InfoLabelValue from "@/ui/info-label-value";

interface ProductInfoProps {
  product: ProductDataModel;
  isEditable?: boolean;
  onValueChange?: (field: keyof ProductDataModel, value: string) => void;
}

const ProductInfo = ({ product, isEditable = false }: ProductInfoProps) => {
  return (
    <div className="flex flex-col border-b border-lg">
      <div className="flex">
        <InfoLabelValue
          label="품목명"
          value={product.productName}
          isEditing={isEditable}
          placeholder="품목명 입력"
        />
        <InfoLabelValue
          label="품목 코드"
          value={product.productCode}
          isEditing={isEditable}
          placeholder="품목 코드 입력"
        />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="규격"
          value={product.size}
          isEditing={isEditable}
          placeholder="규격 입력"
        />
        <InfoLabelValue
          label="단위"
          value={product.unit}
          isEditing={isEditable}
          placeholder="단위 입력"
        />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="현재 재고"
          value={product.stock === -1 ? "" : product.stock.toLocaleString()}
          isEditing={isEditable}
          placeholder="현재 재고 입력"
        />
        <InfoLabelValue
          label="평균 생산 시간"
          value={product.productionTime}
          isEditing={isEditable}
          placeholder="-"
        />
      </div>
      <InfoLabelValue
        label="창고 위치"
        value={isEditable ? product.location : product.location || "-"}
        isEditing={isEditable}
        placeholder="위치 입력"
      />
      <InfoLabelValue
        label="특이사항"
        value={
          product.comment && product.comment.length > 0 ? (
            <ul>
              {product.comment.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          ) : (
            "-"
          )
        }
        isEditing={isEditable}
        placeholder="특이사항 입력"
      />
    </div>
  );
};

export default ProductInfo;
