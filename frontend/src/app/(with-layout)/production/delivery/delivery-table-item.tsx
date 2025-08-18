import Chip from '@/ui/chip';
import {
  DeliveryStatusColorMap,
  DeliveryStatusType,
  ProjectStatusType,
} from '@/types/status-type';
import {
  QuotationProductResponseModel,
  ProductResponseModel,
} from '@/types/data-model';
import Checkbox from '@/ui/checkbox';
import { usePortalDropdown, formatDate } from '@/hooks';
import DeliveryStateDropdown from './modals/delivery-state-dropdown';
import { useForm, Controller } from 'react-hook-form';
import { useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { useUpdateQuotationProductDelivery } from '@/hooks/document/quotation/use-update-quotation-product-delivery';

interface DeliveryTableItemProps {
  data: QuotationProductResponseModel;
  productDetail: ProductResponseModel | null;
  isChecked: boolean;
  onToggle: () => void;
  onItemClick: (
    data: QuotationProductResponseModel,
    productDetail: ProductResponseModel | null
  ) => void;
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
  productDetail,
  isChecked,
  onToggle,
  onItemClick,
  projectStatus,
  onDeliveryDateChange,
  onDeliveryStatusChange,
}: DeliveryTableItemProps) => {
  const { quantity, delivery_date, is_delivery, id } = data;
  const { isOpen, openDropdown, closeDropdown, anchorRect } =
    usePortalDropdown();

  const { updateQuotationProductDelivery, isLoading } =
    useUpdateQuotationProductDelivery();

  const { control, setValue, watch } = useForm<DeliveryFormDataModel>({
    defaultValues: {
      deliveryDate: data.delivery_date || '',
      deliveryStatus: data.is_delivery ? '완료' : '예정',
    },
  });

  const deliveryStatus = watch('deliveryStatus');
  const colors = DeliveryStatusColorMap[deliveryStatus as DeliveryStatusType];

  // 디바운스된 납품일자 변경 함수 (500ms)
  const debouncedDateChange = useDebouncedCallback(async (newDate: string) => {
    if (newDate !== data.delivery_date && newDate.length === 10) {
      try {
        const result = await updateQuotationProductDelivery(data.id || 0, {
          delivery_date: newDate,
          is_delivered: data.is_delivery || false,
        });

        if (result.success) {
          // 성공 시 부모 컴포넌트에 알림
          if (onDeliveryDateChange) {
            onDeliveryDateChange(String(data.id || ''), newDate);
          }
        } else {
          console.error('납품일자 변경 실패:', result.error);
          // 실패 시 원래 값으로 되돌리기
          setValue('deliveryDate', data.delivery_date || '');
        }
      } catch (error) {
        console.error('납품일자 변경 중 오류:', error);
        setValue('deliveryDate', data.delivery_date || '');
      }
    }
  }, 500);

  // 납품일자 변경 감지
  const watchedDate = watch('deliveryDate');
  useEffect(() => {
    if (watchedDate && watchedDate !== data.delivery_date) {
      debouncedDateChange(watchedDate);
    }

    // 폼 상태가 변경될 때마다 부모 컴포넌트에 알림 (즉시 UI 업데이트)
    if (onDeliveryDateChange) {
      onDeliveryDateChange(String(data.id || ''), watchedDate || '');
    }
  }, [
    watchedDate,
    debouncedDateChange,
    data.delivery_date,
    onDeliveryDateChange,
    data.id,
  ]);

  const handleStatusChange = async (newStatus: string) => {
    try {
      const result = await updateQuotationProductDelivery(data.id || 0, {
        is_delivered: newStatus === '완료',
      });

      if (result.success) {
        setValue('deliveryStatus', newStatus);
        // 성공 시 부모 컴포넌트에 알림
        if (onDeliveryStatusChange) {
          onDeliveryStatusChange(String(data.id || ''), newStatus);
        }
      } else {
        console.error('납품상태 변경 실패:', result.error);
        // 실패 시 원래 값으로 되돌리기
        setValue('deliveryStatus', data.is_delivery ? '완료' : '예정');
      }
    } catch (error) {
      console.error('납품상태 변경 중 오류:', error);
      setValue('deliveryStatus', data.is_delivery ? '완료' : '예정');
    }
    closeDropdown();
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatDate(value);
    setValue('deliveryDate', formattedValue);
  };

  return (
    <>
      <div className="flex items-center h-14 min-w-[1305px] rounded border-b border-lg">
        <Checkbox isChecked={isChecked} onToggle={onToggle} />
        <div className="w-[150px] flex items-center py-3 px-2">
          <Chip
            text={deliveryStatus}
            bgColor={colors.bgColor}
            textColor={colors.textColor}
            state={projectStatus === 'delivery' ? true : false}
            onClick={
              projectStatus === 'delivery'
                ? (e) => e && openDropdown(e)
                : undefined
            }
          />
        </div>
        <div
          className="flex-2 px-3 flex justify-between cursor-pointer group"
          onClick={() => onItemClick(data, productDetail)}
        >
          <p
            className=" text-dg Me_Body-1 truncate"
            title={productDetail?.name || '-'}
          >
            {productDetail?.name || '-'}
          </p>
          <p className="shrink-0 Re_Body-1 text-gr opacity-0 group-hover:opacity-100 transition-opacity duration-200 ">
            납품표 보기
          </p>
        </div>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate"
          title={productDetail?.code || '-'}
        >
          {productDetail?.code || '-'}
        </p>
        <p
          className="flex-1 px-3 text-dg Me_Body-1 truncate"
          title={productDetail?.spec || '-'}
        >
          {productDetail?.spec || '-'}
        </p>
        <p
          className="w-[80px] px-3 text-dg Me_Body-1 truncate"
          title={productDetail?.unit || '-'}
        >
          {productDetail?.unit || '-'}
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
