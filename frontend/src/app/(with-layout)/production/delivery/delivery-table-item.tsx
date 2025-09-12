import Chip from '@/ui/chip';
import {
  DeliveryStatusColorMap,
  DeliveryStatusType,
  ProjectStatusType,
} from '@/types/status-type';
import { ProjectQuotationProductsModel } from '@/types/data-model';
import Checkbox from '@/ui/checkbox';
import { usePortalDropdown, formatDate } from '@/hooks';
import DeliveryStateDropdown from './modals/delivery-state-dropdown';
import { useForm, Controller } from 'react-hook-form';
import { useState } from 'react';
import { useUpdateQuotationProductDelivery } from '@/hooks/document/quotation/use-update-quotation-product-delivery';
import MiniBtn from '@/ui/mini-btn';

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

  const { control, setValue, watch, formState } =
    useForm<DeliveryFormDataModel>({
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
  const { bgColor, textColor } =
    DeliveryStatusColorMap[deliveryStatus as DeliveryStatusType];

  // 날짜 입력 핸들러 (포맷만 적용, 저장은 버튼으로)
  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const formattedValue = formatDate(value);
    setValue('deliveryDate', formattedValue, { shouldValidate: true });
  };

  // 상태 변경 시 서버 반영
  const handleStatusChange = async (newStatus: string) => {
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

  // 저장 버튼 클릭 시에만 서버 저장
  const handleSaveClick = async () => {
    try {
      const result = await updateQuotationProductDelivery(
        quotationProductId || 0,
        {
          delivery_date: watchedDate,
          is_delivery: isDelivery || false,
        }
      );

      if (result.success) {
        setSavedDate(watchedDate);
        if (onDeliveryDateChange) {
          onDeliveryDateChange(
            String(quotationProductId || ''),
            watchedDate || ''
          );
        }
      } else {
        console.error('납품일자 변경 실패:', result.error);
      }
    } catch (error) {
      console.error('납품일자 변경 중 오류:', error);
    }
  };

  return (
    <>
      <div className="flex items-center h-14 min-w-[1305px] rounded border-b border-lg">
        <Checkbox isChecked={isChecked} onToggle={onToggle} />
        <div className="w-[150px] flex items-center py-3 px-2">
          <Chip
            text={deliveryStatus}
            bgColor={bgColor}
            textColor={textColor}
            state={projectStatus !== 'completed' ? true : false}
            onClick={
              projectStatus !== 'completed'
                ? (e) => e && openDropdown(e)
                : undefined
            }
          />
        </div>
        <div
          className="flex-2 px-3 flex justify-between cursor-pointer group"
          onClick={() => onItemClick(data)}
        >
          <p className=" text-dg Me_Body-1 truncate" title={productName || '-'}>
            {productName || '-'}
          </p>
          <p className="shrink-0 Re_Body-1 text-gr opacity-0 group-hover:opacity-100 transition-opacity duration-200 ">
            납품표 보기
          </p>
        </div>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate"
          title={productCode || '-'}
        >
          {productCode || '-'}
        </p>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate"
          title={productSpec || '-'}
        >
          {productSpec || '-'}
        </p>
        <p
          className="w-[80px] px-3 text-dg Me_Body-1 truncate"
          title={productUnit || '-'}
        >
          {productUnit || '-'}
        </p>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate"
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
                disabled={projectStatus === 'completed' || isLoading}
                onChange={handleDateInput}
                maxLength={10}
              />
            )}
          />
        </div>
        {projectStatus !== 'completed' && (
          <div className="w-[150px] px-3">
            <MiniBtn
              text="저장"
              textColor="text-dg"
              borderColor="border-lg"
              hoverColor="hover:bg-bg"
              height="h-8"
              onClick={handleSaveClick}
              disabled={
                isLoading || !formState.isValid || watchedDate === savedDate
              }
            />
          </div>
        )}
      </div>
      {isOpen && anchorRect && (
        <DeliveryStateDropdown
          onClose={closeDropdown}
          onPendingClick={() => handleStatusChange('예정')}
          onCompletedClick={() => handleStatusChange('완료')}
          anchorRect={anchorRect}
        />
      )}
    </>
  );
};

export default DeliveryTableItem;
