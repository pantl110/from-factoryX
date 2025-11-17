import Panel from '@/ui/panel';
import MiniBtn from '@/ui/mini-btn';
import { ProductionInfo } from './production-info';
import { DefectRate } from './defect-rate';
import { ScrapRate } from './scrap-rate';
import { ProjectPlanModel } from '@/types/data-model';

interface ProductionResultPanelProps {
  onClose: () => void;
  plan: ProjectPlanModel;
}

export const ProductionResultPanel = ({
  onClose,
  plan,
}: ProductionResultPanelProps) => {
  return (
    <Panel
      title="생산 결과 입력"
      onClose={onClose}
      headerButton={
        <MiniBtn text="저장" variant="primary" onClick={() => {}} />
      }
    >
      <div className="flex flex-col gap-10">
        {/* 생산 상세 정보 */}
        <ProductionInfo plan={plan} />

        {/* 불량률 정보 */}
        <DefectRate />

        {/* 스크랩율 정보 */}
        <ScrapRate />
      </div>
    </Panel>
  );
};
