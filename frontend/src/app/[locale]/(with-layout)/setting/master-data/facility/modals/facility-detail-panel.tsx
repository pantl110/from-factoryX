import Panel from '@/ui/panel';
import InfoLabelValue from '@/ui/info-label-value';
import FacilityHistoryItem from './facility-history-item';
import TextareaAutosize from 'react-textarea-autosize';
import { EquipmentResponseModel } from '@/types/data-model';
import { useCreateEquipment, useUpdateEquipment } from '@/hooks';
import useMemberStore from '@/store/member-store';
import { EquipmentStatusType } from '@/types/status-type';
import { Controller, useForm } from 'react-hook-form';
import MiniBtn from '@/ui/mini-btn';
import { useEffect, useState } from 'react';
import useGetEquipmentDetail from '@/hooks/factory/factory-equipment/use-get-equipment-detail';
import NoHistoryBox from '@/ui/no-history-box';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

interface FacilityDetailPanelProps {
  facilityId?: number;
  onClose: () => void;
  onSuccess?: () => void;
  showWarningToast?: () => void;
  facilityList?: EquipmentResponseModel[]; // 설비 목록 prop 추가
}

interface FacilityFormModel {
  name: string;
  priority: string;
  location?: string;
  note?: string;
}

const FacilityDetailPanel = ({
  facilityId,
  onClose,
  onSuccess,
  showWarningToast,
  facilityList,
}: FacilityDetailPanelProps) => {
  const tCommon = useTranslations('common');
  const tFacility = useTranslations('setting.masterData.facility.detailPanel');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const { createEquipment } = useCreateEquipment();
  const { updateEquipment } = useUpdateEquipment();
  const factoryId = useMemberStore((state) => state.factoryId);
  const initializeFactoryId = useMemberStore(
    (state) => state.initializeFactoryId
  );

  // factoryId가 null이면 초기화
  useEffect(() => {
    if (!factoryId) {
      initializeFactoryId();
    }
  }, [factoryId, initializeFactoryId]);

  // useGetEquipmentDetail 훅 사용
  const { getEquipmentDetail, isLoading } = useGetEquipmentDetail();
  const [facility, setFacility] = useState<EquipmentResponseModel | null>(null);

  // facilityId가 변경될 때마다 설비 정보 가져오기
  useEffect(() => {
    const fetchFacilityDetail = async () => {
      if (facilityId) {
        const result = await getEquipmentDetail(facilityId);
        if (result.success && result.data) {
          // Ensure history is always an array
          const facilityData = {
            ...result.data,
            plans: result.data.plans || [],
          };
          setFacility(facilityData);
        }
      }
    };

    fetchFacilityDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facilityId]);

  const {
    handleSubmit,
    formState: { isValid, isDirty },
    control,
    reset,
    setValue,
  } = useForm<FacilityFormModel>({
    mode: 'onChange',
    defaultValues: {
      name: facility?.name || '',
      priority: facility?.priority?.toString() || '',
      location: facility?.location || '',
      note: facility?.note || '',
    },
  });

  useEffect(() => {
    reset({
      name: facility?.name || '',
      priority: facility?.priority?.toString() || '',
      location: facility?.location || '',
      note: facility?.note || '',
    });
  }, [facility, reset]);

  // priority 중복 체크 함수 (실제 구현)
  const checkPriorityDuplicate = (value: string) => {
    if (!value || !facilityList) return false;
    const numValue = Number(value);
    if (isNaN(numValue)) return false;
    return facilityList.some(
      (eq) => eq.priority === numValue && eq.id !== facility?.id
    );
  };

  // 저장 버튼 클릭 시 생성/수정 분기
  const onSubmit = async (data: FacilityFormModel) => {
    // 저장 시 priority 중복 체크
    if (checkPriorityDuplicate(data.priority)) {
      showWarningToast?.();
      if (facility) {
        // 수정 모드: 원래 값으로 복원
        setValue('priority', facility.priority?.toString() || '');
      } else {
        // 생성 모드: 빈 값으로 초기화
        setValue('priority', '');
      }
      return; // 중복이면 저장 중단
    }

    if (facility) {
      // 수정 (PATCH)
      const payload = {
        name: data.name,
        status: facility.status,
        priority: Number(data.priority),
        location: data.location || '',
        note: data.note || '',
      };

      const result = await updateEquipment(facility.id, payload);

      if (result && result.success) {
        onSuccess?.();
        onClose();
      } else {
        alert(
          tFacility('errors.updateFailed') +
            (result?.error || tFacility('errors.unknownError'))
        );
      }
    } else {
      // 생성 (POST)
      if (!factoryId) {
        alert(tFacility('errors.factoryNotFound'));
        return;
      }
      const payload = {
        factory: factoryId,
        name: data.name,
        priority: Number(data.priority),
        location: data.location || '',
        note: data.note || '',
      };
      const result = await createEquipment(payload);
      if (result && result.success) {
        onSuccess?.();
        onClose(); // 생성 성공 후 판넬 닫기
      } else {
        alert(
          tFacility('errors.createFailed') +
            (result?.error || tFacility('errors.unknownError'))
        );
      }
    }
  };

  return (
    <Panel
      title={tFacility('title')}
      onClose={onClose}
      headerButton={
        (!facility || isDirty) && (
          <MiniBtn variant="secondary"
            text={tCommon('save')}
            onClick={handleSubmit(onSubmit)}
            disabled={!isValid}
          />
        )
      }
    >
      {isLoading ? null : (
        <div className="flex flex-col gap-10">
          {/* 설비 정보 */}
          <div className="flex flex-col gap-3 border-b border-lg">
            <h3 className="Heading-3">{tFacility('facilityInfo')}</h3>
            <div className="flex flex-col">
              <Controller
                name="name"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <InfoLabelValue
                    label={tFacility('facilityName')}
                    placeholder={tFacility('facilityNamePlaceholder')}
                    required
                    {...field}
                    isEditing={!isViewer && hasSubscription()}
                  />
                )}
              />
              <InfoLabelValue
                label={tFacility('operationStatus')}
                chip={{
                  status: (facility?.status ??
                    'standby') as EquipmentStatusType,
                }}
              />
              <Controller
                name="priority"
                control={control}
                rules={{
                  required: true,
                  min: 1,
                  pattern: {
                    value: /^[1-9]\d*$/,
                    message: tFacility('errors.invalidPriority'),
                  },
                }}
                render={({ field }) => (
                  <InfoLabelValue
                    label={tFacility('priority')}
                    placeholder={tFacility('priorityPlaceholder')}
                    isEditing={!isViewer && hasSubscription()}
                    inputType="text"
                    required
                    value={
                      field.value === undefined ||
                      field.value === null ||
                      field.value === ''
                        ? ''
                        : field.value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                    }
                    onChange={(e) => {
                      const numValue = e.target.value.replace(/[^0-9]/g, '');
                      field.onChange(numValue ? numValue : '');
                    }}
                    onBlur={field.onBlur} // eslint-disable-line react/jsx-handler-names
                  />
                )}
              />
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <InfoLabelValue
                    label={tFacility('location')}
                    placeholder={tFacility('locationPlaceholder')}
                    isEditing={!isViewer && hasSubscription()}
                    {...field}
                  />
                )}
              />
            </div>
          </div>

          {/* 특이사항 */}
          <div className="flex flex-col gap-3">
            <h3 className="Heading-3">{tCommon('note')}</h3>
            <Controller
              name="note"
              control={control}
              render={({ field }) => (
                <TextareaAutosize
                  minRows={6}
                  className="w-full border border-lg rounded-lg pt-5 px-3 Re_Body-1 text-gr resize-none"
                  placeholder="-"
                  {...field}
                  disabled={isViewer || !hasSubscription()}
                />
              )}
            />
          </div>

          {/* 생산 히스토리 */}
          <div className="flex flex-col gap-3">
            <h3 className="Heading-3">{tFacility('productionHistory')}</h3>
            <div className="flex flex-col">
              {facility && facility.plans && facility.plans.length > 0 ? (
                <>
                  <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 text-sv rounded-sm cursor-default">
                    <p className="px-3 flex-1">{tCommon('productName')}</p>
                    <p className="px-3 flex-1">{tCommon('productionQty')}</p>
                    <p className="px-3 flex-1">{tCommon('productionDate')}</p>
                    <p className="px-3 flex-1">
                      {tCommon('expectedCompletionDate')}
                    </p>
                    <p className="px-3 flex-1">{tFacility('unitTime')}</p>
                  </div>
                  {facility.plans?.map((plan) => (
                    <FacilityHistoryItem key={plan.id} plan={plan} />
                  ))}
                </>
              ) : (
                <NoHistoryBox
                  title={tFacility('empty.title')}
                  text={tFacility('empty.description')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Panel>
  );
};

export default FacilityDetailPanel;
