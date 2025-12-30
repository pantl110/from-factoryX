import { InfoLabelValue } from '@/ui';

interface DepositorInfoDisplayProps {
  depositorName?: string;
}

// 입금 확인 정보 표시 컴포넌트 (매출용)
export const DepositorInfoDisplay = ({
  depositorName,
}: DepositorInfoDisplayProps) => {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">입금 확인 정보</h3>

      <div>
        <div className="flex border-b border-lg w-full">
          <InfoLabelValue label="입금자명" value={depositorName || '-'} />
        </div>
      </div>
    </div>
  );
};
