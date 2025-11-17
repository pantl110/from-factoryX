import { ProjectPlanModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';

interface ProductionInfoProps {
  plan: ProjectPlanModel;
}
export const ProductionInfo = ({ plan }: ProductionInfoProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3 h-10 flex items-center">생산 상세 정보</h3>

      <div>
        <div className="flex">
          <InfoLabelValue
            label="제품명"
            value={plan.quotation_product.product.name}
          />
          <InfoLabelValue
            label="제품 코드"
            value={plan.quotation_product.product.code}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="규격"
            value={plan.quotation_product.product.spec}
          />
          <InfoLabelValue
            label="단위"
            value={plan.quotation_product.product.unit}
          />
        </div>
        <div className="flex">
          <InfoLabelValue
            label="주문 수량"
            value={plan.quotation_product.quantity?.toLocaleString()}
          />
          <InfoLabelValue
            label="생산 지시 수량"
            value={plan.quantity?.toLocaleString()}
          />
        </div>
        <div className="flex">
          <InfoLabelValue label="생산 설비" value={plan.equipment.name} />
          <InfoLabelValue
            label="단위당 소요 시간"
            value={`${plan.avg_production_time?.toLocaleString()}초`}
          />
        </div>
        <div className="flex">
          <InfoLabelValue label="제품 재고 상태" value="" />
          <InfoLabelValue label="생산 완료 일자" value={plan.end_date} />
        </div>
      </div>
    </div>
  );
};
