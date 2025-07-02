import InfoLabelValue from "@/ui/info-label-value";

const ProductInfo = () => {
  return (
    <div className="flex flex-col">
      <div className="flex">
        <InfoLabelValue label="품목명" value="투명아크릴판" />
        <InfoLabelValue label="품목 코드" value="102938" />
      </div>
      <div className="flex">
        <InfoLabelValue label="규격" value="100 x 300mm" />
        <InfoLabelValue label="단위" value="EA" />
      </div>
      <div className="flex">
        <InfoLabelValue label="현재 재고" value="3,500" />
        <InfoLabelValue label="연결된 원자재" value="알루미늄 시트 외 1종" />
      </div>
      <InfoLabelValue label="창고 위치" value="A동 2층 랙3번" />
    </div>
  );
};

export default ProductInfo;
