import { Controller, Control } from 'react-hook-form';
import { ClientUpdateModel } from '@/types/data-model';
import InfoLabelValue from '@/ui/info-label-value';

interface DepositorInfoProps {
  control: Control<ClientUpdateModel>;
  isViewer: boolean;
  hasSubscription: () => boolean;
}

// 수주처용 입금자 정보 컴포넌트
export const DepositorInfo = ({
  control,
  isViewer,
  hasSubscription,
}: DepositorInfoProps) => {
  if (!control) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="Heading-3">입금 확인 정보</h3>

      <div>
        <div className="flex border-b border-lg w-full">
          <Controller
            name="depositor_name"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="입금자명"
                isEditing={!isViewer && hasSubscription()}
                placeholder="입금자명을 입력하세요."
                {...field}
              />
            )}
          />
        </div>
      </div>
    </div>
  );
};
