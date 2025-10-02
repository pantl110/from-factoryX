import Chip from '@/ui/chip';
import {
  DeliveryStatusColorMap,
  DeliveryStatusType,
  ProjectStatusType,
} from '@/types/status-type';
import { ProjectQuotationProductsModel } from '@/types/data-model';
import Checkbox from '@/ui/checkbox';
import { usePortalDropdown, formatDate, useToast } from '@/hooks';
import DeliveryStateDropdown from './modals/delivery-state-dropdown';
import { useForm, Controller } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { useUpdateQuotationProductDelivery } from '@/hooks/document/quotation/use-update-quotation-product-delivery';
import Toast from '@/ui/toast';
import { WarningCircle } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

interface DeliveryTableItemProps {
  data: ProjectQuotationProductsModel;
  isChecked: boolean;
  onToggle: () => void;
  onItemClick: (data: ProjectQuotationProductsModel) => void;
  projectStatus: ProjectStatusType;
  onDeliveryDateChange?: (id: string, newDate: string) => void;
  onDeliveryStatusChange?: (id: string, newStatus: string) => void;
}

interface DeliveryFormDataModel {
  deliveryDate: string;
  deliveryStatus: string;
}

const DeliveryTableItem = ({
  data,
  isChecked,
  onToggle,
  onItemClick,
  projectStatus,
  onDeliveryDateChange,
  onDeliveryStatusChange,
}: DeliveryTableItemProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const {
    id: quotationProductId,
    quantity,
    is_delivery: isDelivery,
    delivery_date: deliveryDate,
    product: {
      name: productName,
      code: productCode,
      spec: productSpec,
      unit: productUnit,
    },
  } = data;

  const { isOpen, openDropdown, closeDropdown, anchorRect } =
    usePortalDropdown();

  const { updateQuotationProductDelivery, isLoading } =
    useUpdateQuotationProductDelivery();

  const { isToastOpen, isVisible, showToast } = useToast();
  const [text, setText] = useState('');
  const [subtext, setSubtext] = useState('');

  const { control, setValue, watch } = useForm<DeliveryFormDataModel>({
    defaultValues: {
      deliveryDate: deliveryDate || '',
      deliveryStatus: isDelivery ? '완료' : '예정',
    },
    mode: 'onChange',
  });

  // 저장 여부 판단용 기준 날짜 (저장 성공 시 갱신)
  const [savedDate, setSavedDate] = useState<string>(deliveryDate || '');

  const deliveryStatus = watch('deliveryStatus');
  const watchedDate = watch('deliveryDate');
  const [debouncedDate] = useDebounce(watchedDate, 500);

  const { bgColor, textColor } =
    DeliveryStatusColorMap[deliveryStatus as DeliveryStatusType];

  // 가동완료(= manufactured) 이상에서만 납품상태 변경 허용
  const isEditable = projectStatus !== 'completed';

  // 날짜 입력 핸들러 (포맷만 적용, 저장은 버튼으로)
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatDate(value);
    setValue('deliveryDate', formattedValue, { shouldValidate: true });
  };

  // 상태 변경 시 서버 반영
  const handleStatusChange = async (newStatus: string) => {
    // 완료로 변경할 때 납품일자가 없으면 토스트 띄우고 중단
    if (newStatus === '완료' && !watchedDate) {
      setText('납품 상태 변경에 실패했습니다.');
      setSubtext('납품일자를 입력해 주세요.');
      showToast();
      closeDropdown();
      return;
    }

    try {
      const result = await updateQuotationProductDelivery(
        quotationProductId || 0,
        {
          delivery_date: newStatus === '완료' ? watchedDate : savedDate,
          is_delivery: newStatus === '완료',
        }
      );

      if (result.success) {
        setValue('deliveryStatus', newStatus);
        // 성공 시 부모 컴포넌트에 알림
        if (onDeliveryStatusChange) {
          onDeliveryStatusChange(String(quotationProductId || ''), newStatus);
        }
      } else {
        console.error('납품상태 변경 실패:', result.error);
        // 실패 시 원래 값으로 되돌리기
        setValue('deliveryStatus', isDelivery ? '완료' : '예정');
      }
    } catch (error) {
      console.error('납품상태 변경 중 오류:', error);
      setValue('deliveryStatus', isDelivery ? '완료' : '예정');
    }
    closeDropdown();
  };

  // 디바운스된 날짜 변경 시 자동 저장
  useEffect(() => {
    // 유효한 날짜 형식이고 저장된 날짜와 다를 때만 저장
    if (
      debouncedDate &&
      debouncedDate !== savedDate &&
      /^\d{4}-\d{2}-\d{2}$/.test(debouncedDate) &&
      projectStatus !== 'completed'
    ) {
      const saveDate = async () => {
        try {
          const result = await updateQuotationProductDelivery(
            quotationProductId || 0,
            {
              delivery_date: debouncedDate,
              is_delivery: isDelivery || false,
            }
          );

          if (result.success) {
            setSavedDate(debouncedDate);
            if (onDeliveryDateChange) {
              onDeliveryDateChange(
                String(quotationProductId || ''),
                debouncedDate || ''
              );
            }
          } else {
            // 실패 시 입력값을 savedDate로 되돌리고 savedDate는 유지
            setValue('deliveryDate', savedDate);
            setText('납품일자 변경에 실패했습니다.');

            // 서버 응답의 detail 메시지에 따라 서브텍스트 설정
            if (result?.error?.includes('날짜 형식이 올바르지 않습니다')) {
              setText('납품일자가 올바른 형식이 아닙니다');
              setSubtext('YYYY-MM-DD 형식으로 입력해주세요.');
            } else {
              setSubtext('다시 시도해주세요.');
            }

            showToast();
          }
        } catch {
          // 실패 시 입력값을 빈값으로 되돌리고 savedDate는 유지
          setValue('deliveryDate', '');
          setText('납품일자 변경에 실패했습니다.');
          setSubtext('유효한 납품일자를 입력해 주세요.');
          showToast();
        }
      };

      saveDate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedDate, savedDate, projectStatus]); // 의존성 배열을 최소화

  // 저장 버튼 클릭 시에만 서버 저장 (기존 함수 유지)
  // const handleSaveClick = async () => {
  //   try {
  //     const result = await updateQuotationProductDelivery(
  //       quotationProductId || 0,
  //       {
  //         delivery_date: watchedDate,
  //         is_delivery: isDelivery || false,
  //       }
  //     );

  //     if (result.success) {
  //       setSavedDate(watchedDate);
  //       if (onDeliveryDateChange) {
  //         onDeliveryDateChange(
  //           String(quotationProductId || ''),
  //           watchedDate || ''
  //         );
  //       }
  //     } else {
  //       console.error('납품일자 변경 실패:', result.error);
  //     }
  //   } catch (error) {
  //     console.error('납품일자 변경 중 오류:', error);
  //   }
  // };

  return (
    <>
      <div className="flex items-center h-14 min-w-[1305px] rounded border-b border-lg">
        {hasSubscription() && (
          <Checkbox isChecked={isChecked} onToggle={onToggle} />
        )}
        <div className="w-[150px] flex items-center py-3 px-2">
          <Chip
            text={deliveryStatus}
            bgColor={bgColor}
            textColor={textColor}
            state={isEditable && !isViewer && hasSubscription()}
            onClick={
              isEditable && !isViewer && hasSubscription()
                ? (e) => e && openDropdown(e)
                : undefined
            }
          />
        </div>
        <div
          className={`flex-2 px-3 flex justify-between ${
            hasSubscription() ? 'cursor-pointer group' : ''
          }`}
          onClick={hasSubscription() ? () => onItemClick(data) : undefined}
        >
          <p className=" text-dg Me_Body-1 truncate" title={productName || '-'}>
            {productName || '-'}
          </p>
          {hasSubscription() && (
            <p className="shrink-0 Re_Body-1 text-gr opacity-0 group-hover:opacity-100 transition-opacity duration-200 ">
              납품표 보기
            </p>
          )}
        </div>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate cursor-default"
          title={productCode || '-'}
        >
          {productCode || '-'}
        </p>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate cursor-default"
          title={productSpec || '-'}
        >
          {productSpec || '-'}
        </p>
        <p
          className="w-[80px] px-3 text-dg Me_Body-1 truncate cursor-default"
          title={productUnit || '-'}
        >
          {productUnit || '-'}
        </p>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate cursor-default"
          title={quantity.toLocaleString()}
        >
          {quantity.toLocaleString()}
        </p>
        <div className="flex-1 px-3">
          <Controller
            name="deliveryDate"
            control={control}
            rules={{
              required: '납품일자를 입력해주세요',
              pattern: {
                value: /^\d{4}-\d{2}-\d{2}$/,
                message: 'YYYY-MM-DD 형식으로 입력해주세요',
              },
            }}
            render={({ field }) => (
              <input
                {...field}
                type="text"
                placeholder="YYYY-MM-DD"
                className="text-dg Me_Body-1 focus:outline-none w-full"
                disabled={
                  projectStatus === 'completed' ||
                  isLoading ||
                  isViewer ||
                  !hasSubscription()
                }
                onChange={handleDateInput}
                maxLength={10}
              />
            )}
          />
        </div>
      </div>
      {isOpen && anchorRect && (
        <DeliveryStateDropdown
          onClose={closeDropdown}
          onPendingClick={() => handleStatusChange('예정')}
          onCompletedClick={() => handleStatusChange('완료')}
          anchorRect={anchorRect}
        />
      )}
      {isToastOpen && (
        <Toast
          isVisible={isVisible}
          icon={<WarningCircle size={20} className="text-red" />}
          text={text}
          subtext={subtext}
          type="red"
        />
      )}
    </>
  );
};

export default DeliveryTableItem;
