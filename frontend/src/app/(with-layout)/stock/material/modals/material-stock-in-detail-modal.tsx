import { InfoLabelValue, MiniBtn, Modal, Toast } from '@/ui';
import { useForm, Controller } from 'react-hook-form';
import { useEffect, useState } from 'react';
import {
  useGetMaterialHistoryDetail,
  useUpdateMaterialHistoryV2,
  useToast,
  getMaterialHistoryQueryKey,
} from '@/hooks';
import { WarningCircle } from '@phosphor-icons/react';
import { removeTrailingZeros, formatDate } from '@/utils';
import { useQueryClient } from '@tanstack/react-query';
import useMemberStore from '@/store/member-store';

interface MaterialStockInDetailModalProps {
  historyId: number | null;
  materialId?: number;
  onClose: () => void;
  onUpdateSuccess?: () => void;
}

interface MaterialHistoryFormModel {
  warehouse_location: string | null;
  expiration_date: string | null;
}

export const MaterialStockInDetailModal = ({
  historyId,
  materialId,
  onClose,
  onUpdateSuccess,
}: MaterialStockInDetailModalProps) => {
  const { isToastOpen, isVisible, showToast } = useToast();
  const [toastText, setToastText] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');
  const queryClient = useQueryClient();
  const factoryId = useMemberStore((state) => state.factoryId);

  const {
    data: historyDetail,
    isLoading,
    error,
  } = useGetMaterialHistoryDetail(historyId);
  const { updateMaterialHistory, isLoading: isUpdating } =
    useUpdateMaterialHistoryV2();

  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<MaterialHistoryFormModel>({
    defaultValues: {
      warehouse_location: null,
      expiration_date: null,
    },
  });

  // 데이터가 로드되면 폼에 값 설정
  useEffect(() => {
    if (historyDetail) {
      reset({
        warehouse_location: historyDetail.warehouse_location || null,
        expiration_date: historyDetail.expiration_date || null,
      });
    }
  }, [historyDetail, reset]);

  const showToastMessage = (text: string, subtext: string) => {
    setToastText(text);
    setToastSubtext(subtext);
    showToast();
  };

  const onSubmit = async (data: MaterialHistoryFormModel) => {
    if (!historyId) {
      showToastMessage('이력 ID가 없습니다.', '올바른 이력을 선택해주세요.');
      return;
    }

    const result = await updateMaterialHistory(historyId, {
      warehouse_location: data.warehouse_location || null,
      expiration_date: data.expiration_date || null,
    });

    if (result.success && result.data) {
      // material-history 쿼리 무효화하여 목록 갱신
      if (factoryId && materialId) {
        await queryClient.invalidateQueries({
          queryKey: getMaterialHistoryQueryKey(factoryId, {
            material_id: materialId,
            type: 'purchase',
          }),
        });
      }
      // 부모 히스토리 상세 쿼리도 무효화 (소분하기 모달에서 최신 데이터 사용)
      if (factoryId && historyId) {
        await queryClient.invalidateQueries({
          queryKey: ['material-history-detail', factoryId, historyId],
        });
      }
      onUpdateSuccess?.();
      onClose();
    } else {
      // 유통기한 형식 에러인 경우 다른 토스트 메시지 표시
      const errorMessage = result.error || '';
      if (errorMessage.includes('유통기한 형식이 올바르지 않습니다')) {
        showToastMessage(
          '유효한 유통기한을 입력해 주세요.',
          'YYYY-MM-DD 형식으로 입력해 주세요.'
        );
      } else {
        showToastMessage(
          '수정에 실패했습니다.',
          errorMessage || '잠시 후 다시 시도해 주세요.'
        );
      }
    }
  };

  // 로딩 중이거나 에러가 있으면 표시
  if (isLoading || error || !historyDetail) {
    return (
      <Modal onClose={onClose} width="w-[800px]" title="">
        <div className="h-50" />
      </Modal>
    );
  }

  const lotNumber = historyDetail.lot_number || '-';

  return (
    <Modal onClose={onClose} width="w-[800px]" title={`[${lotNumber}]`}>
      {/* 상세정보 */}
      <div className="flex flex-col gap-3 pt-4">
        <h4 className="Heading-4">상세정보</h4>
        <form onSubmit={handleSubmit(onSubmit)}>
          <InfoLabelValue
            label="입고 수량"
            value={removeTrailingZeros(historyDetail.quantity)}
            disabled
          />
          <InfoLabelValue
            label="남은 수량"
            value={removeTrailingZeros(historyDetail.remaining_quantity)}
            disabled
          />

          <Controller
            name="warehouse_location"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="창고 위치"
                value={field.value || ''}
                placeholder="창고 위치를 입력하세요."
                isEditing={true}
                onChange={(e) => field.onChange(e.target.value || null)}
              />
            )}
          />

          <Controller
            name="expiration_date"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label="유통기한"
                value={field.value || ''}
                placeholder="YYYY-MM-DD"
                isEditing={true}
                onChange={(e) => {
                  const formattedValue = formatDate(e.target.value);
                  field.onChange(formattedValue || null);
                }}
              />
            )}
          />

          {/* 버튼 */}
          <div className="flex justify-end gap-2.5 mt-5">
            <MiniBtn
              text="취소"
              variant="white"
              onClick={onClose}
              disabled={isUpdating}
            />
            <MiniBtn
              text="수정하기"
              variant="secondary"
              type="submit"
              disabled={!isDirty || isUpdating}
            />
          </div>
        </form>
      </div>

      {/* 토스트 메시지 */}
      {isToastOpen && (
        <Toast
          icon={<WarningCircle size={20} className="text-red" />}
          text={toastText}
          subtext={toastSubtext}
          type="red"
          isVisible={isVisible}
        />
      )}
    </Modal>
  );
};
