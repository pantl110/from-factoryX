import MoChip from '@/ui/mo-chip';
import { LabelInfo } from '../label-info';
import InfoDetail from '../info-detail';

const MaterialInfo = () => {
  return (
    <div className="px-7 py-8 flex flex-col gap-8">
      <h3 className="m-Heading-3-semibold">자재 정보</h3>
      <div className="flex flex-col gap-5">
        <LabelInfo
          label="구분"
          chip={<MoChip text="원자재" variant="orange" />}
        />
        <LabelInfo label="자재명" value="원자재 A" />
        <LabelInfo label="자재코드" value="P-001" />
        <LabelInfo label="규격" value="3T × 1000 × 2000" />
        <LabelInfo label="개별 단위" value="kg" />
        <LabelInfo label="재고 관리 단위" value="EA" />
        <div className="flex flex-col gap-4">
          <LabelInfo
            label="재고 상태"
            chip={<MoChip text="충분" variant="secondary" />}
          />
          <div className="flex flex-col gap-3">
            <InfoDetail label="현재 재고" value="1,000EA" />
            <InfoDetail label="ROP" value="550EA" />
            <InfoDetail label="안전재고" value="500EA" />
          </div>
        </div>
        <LabelInfo label="유통기한" value="2025-10-03" />
        <LabelInfo
          label="유통기한 상태"
          chip={<MoChip text="부족" variant="red-secondary" />}
        />
      </div>
    </div>
  );
};

export default MaterialInfo;
