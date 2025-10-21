import InfoLabelValue from '@/ui/info-label-value';

export const ProductionInfo = () => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">생산 상세 정보</h3>

      <div>
        <div className="flex">
          <InfoLabelValue label="제품명" value="플라스틱 1" />
          <InfoLabelValue label="제품 코드" value="1234567890" />
        </div>
        <div className="flex">
          <InfoLabelValue label="규격" value="2025-01-01" />
          <InfoLabelValue label="단위" value="10:00" />
        </div>
        <div className="flex">
          <InfoLabelValue label="주문 수량" value="2025-01-01" />
          <InfoLabelValue label="생산 지시 수량" value="2025-01-01" />
        </div>
        <div className="flex">
          <InfoLabelValue label="생산 설비" value="2025-01-01" />
          <InfoLabelValue label="단위당 소요 시간" value="10:00" />
        </div>
        <div className="flex">
          <InfoLabelValue label="제품 재고 상태" value="2025-01-01" />
          <InfoLabelValue label="생산 완료 일자" value="10:00" />
        </div>
      </div>
    </div>
  );
};
