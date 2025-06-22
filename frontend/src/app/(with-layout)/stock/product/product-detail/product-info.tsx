import { ProductDataModel } from "@/mocks/product-data";
import InfoLabelValue from "@/ui/info-label-value";

interface ProductInfoProps {
  product: ProductDataModel;
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div className="flex flex-col border-b border-lg">
      <div className="flex">
        <InfoLabelValue label="품목명" value={product.productName} />
        <InfoLabelValue label="품목 코드" value={product.productCode} />
      </div>
      <div className="flex">
        <InfoLabelValue label="규격" value={product.size} />
        <InfoLabelValue label="단위" value={product.unit} />
      </div>
      <div className="flex">
        <InfoLabelValue
          label="현재 재고"
          value={product.stock.toLocaleString()}
        />
        <InfoLabelValue label="평균 생산 시간" value={product.productionTime} />
      </div>
      <InfoLabelValue label="창고 위치" value={product.location || "-"} />
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
      />
    </div>
  );
};

export default ProductInfo;
