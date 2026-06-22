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
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('stock.material.modals.stockInDetail');
  const tStockLocation = useTranslations('stock.stockLocation');
  const tCommon = useTranslations('common');
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
      // null이거나 값이 없으면 "-"로 표시, 아니면 그대로 표시
      const expirationDateValue = !historyDetail.expiration_date
        ? '-'
        : historyDetail.expiration_date;

      reset({
        warehouse_location: historyDetail.warehouse_location || null,
        expiration_date: expirationDateValue,
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
      showToastMessage(
        t('errors.historyIdNotFound.text'),
        t('errors.historyIdNotFound.subtext')
      );
      return;
    }

    // 빈 값이거나 "-"이면 null로 전송, 아니면 그대로 전송
    const trimmedValue = data.expiration_date?.trim();
    const expirationDateValue =
      !data.expiration_date || trimmedValue === '' || trimmedValue === '-'
        ? null
        : data.expiration_date;

    const result = await updateMaterialHistory(historyId, {
      warehouse_location: data.warehouse_location || null,
      expiration_date: expirationDateValue,
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
          t('errors.invalidExpirationDate.text'),
          t('errors.invalidExpirationDate.subtext')
        );
      } else {
        showToastMessage(
          t('errors.updateFailed.text'),
          errorMessage || t('errors.updateFailed.subtext')
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
        <h4 className="Heading-4">{t('detailInfo')}</h4>
        <form onSubmit={handleSubmit(onSubmit)}>
          <InfoLabelValue
            label={t('labels.stockInQuantity')}
            value={removeTrailingZeros(historyDetail.quantity)}
            disabled
          />
          <InfoLabelValue
            label={t('labels.remainingQuantity')}
            value={removeTrailingZeros(historyDetail.remaining_quantity)}
            disabled
          />

          <Controller
            name="warehouse_location"
            control={control}
            render={({ field }) => (
              <InfoLabelValue
                label={tCommon('warehouseLocation')}
                value={field.value || ''}
                placeholder={tStockLocation('placeholders.warehouseLocation')}
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
                label={tCommon('expirationDate')}
                value={field.value || '-'}
                placeholder="YYYY-MM-DD"
                isEditing={true}
                onChange={(e) => {
                  const inputValue = e.target.value.trim();
                  // "-"를 입력하면 그대로 유지, 아니면 날짜 형식으로 변환
                  if (inputValue === '-') {
                    field.onChange('-');
                  } else {
                    const formattedValue = formatDate(e.target.value);
                    field.onChange(formattedValue || null);
                  }
                }}
              />
            )}
          />

          {/* 버튼 */}
          <div className="flex justify-end gap-2.5 mt-5">
            <MiniBtn
              text={tCommon('cancel')}
              variant="gray"
              onClick={onClose}
              disabled={isUpdating}
            />
            <MiniBtn
              text={tCommon('confirm')}
              variant="primary"
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
