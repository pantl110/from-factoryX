import React, { ChangeEvent, ReactNode } from 'react';
import {
  InventoryStatusType,
  InventoryStatusColorMap,
  TaxDocumentType,
  TaxDocumentTypeColorMap,
  EquipmentStatusType,
  EquipmentStatusColorMap,
  MaterialStatusType,
  MaterialStatusTypeColorMap,
  ExpiryStatusType,
  ExpiryStatusColorMap,
  AccountsStatusType,
  AccountsStatusColorMap,
} from '@/types/status-type';
import TextareaAutosize from 'react-textarea-autosize';
import { UseFormRegisterReturn } from 'react-hook-form';
import { RoundChip } from '@/ui';
import { useTranslations } from 'next-intl';

interface InfoLabelValueProps {
  label: string;
  value?: ReactNode;
  chip?: {
    status:
      | InventoryStatusType
      | TaxDocumentType
      | EquipmentStatusType
      | MaterialStatusType
      | ExpiryStatusType
      | AccountsStatusType
      | 'danger';
  };
  isEditing?: boolean;
  placeholder?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleChange?: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onFocus?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onBlur?: (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  inputType?: string;
  textarea?: boolean;
  required?: boolean;
  register?: UseFormRegisterReturn;
  disabled?: boolean;
}

const InfoLabelValue = ({
  label,
  value,
  chip,
  isEditing = false,
  placeholder,
  onChange,
  handleChange,
  onFocus,
  onBlur,
  inputType = 'text',
  textarea = false,
  required = false,
  register,
  disabled = false,
}: InfoLabelValueProps) => {
  const tCommon = useTranslations('common');
  const tMaterial = useTranslations('stock.material');
  const tList = useTranslations('tax.list');
  const colors = chip
    ? chip.status === 'danger'
      ? { bgColor: 'bg-red-8', textColor: 'text-red' }
      : chip.status in TaxDocumentTypeColorMap
        ? TaxDocumentTypeColorMap[chip.status as TaxDocumentType]
        : chip.status in EquipmentStatusColorMap
          ? EquipmentStatusColorMap[chip.status as EquipmentStatusType]
          : chip.status in MaterialStatusTypeColorMap
            ? MaterialStatusTypeColorMap[chip.status as MaterialStatusType]
            : chip.status in ExpiryStatusColorMap
              ? ExpiryStatusColorMap[chip.status as ExpiryStatusType]
              : chip.status in AccountsStatusColorMap
                ? AccountsStatusColorMap[chip.status as AccountsStatusType]
                : InventoryStatusColorMap[chip.status as InventoryStatusType]
    : null;

  const renderChip = () => {
    if (!chip || !colors || !colors.color) return null;

    // InventoryStatusType 번역 키 매핑
    const getInventoryStatusText = (status: string): string => {
      const statusMap: Record<string, string> = {
        과재고: 'inventoryStatus.overstock',
        충분: 'inventoryStatus.sufficient',
        위험: 'inventoryStatus.risk',
        부족: 'inventoryStatus.shortage',
      };
      const translationKey = statusMap[status];
      return translationKey ? tCommon(translationKey) : status;
    };

    return (
      <RoundChip
        variant="sm"
        text={
          chip.status === 'sales'
            ? '매출'
            : chip.status === 'purchase'
              ? '매입'
              : chip.status === 'standby'
                ? '가동 대기'
                : chip.status === 'running'
                  ? '가동 중'
                  : chip.status === 'danger'
                    ? '위험'
                    : chip.status === 'warning'
                      ? tMaterial('expiryStatus.risk')
                      : chip.status === 'safe'
                        ? tMaterial('expiryStatus.safe')
                        : chip.status in AccountsStatusColorMap
                          ? tList(
                              'status.' + (chip.status as AccountsStatusType)
                            )
                          : typeof chip.status === 'string' &&
                              (chip.status === '과재고' ||
                                chip.status === '충분' ||
                                chip.status === '위험' ||
                                chip.status === '부족')
                            ? getInventoryStatusText(chip.status) // 재고 상태 번역
                            : chip.status // 기타 상태는 그대로 표시
        }
        color={colors.color}
      />
    );
  };

  const renderText = () => {
    // value가 없거나 빈 문자열이면 placeholder 표시
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return <span className="text-gr Me_Body-3">{placeholder || '-'}</span>;
    }
    return value;
  };

  const renderContent = () => {
    // 수정 모드인 경우
    if (isEditing) {
      const changeHandler = register?.onChange || handleChange || onChange;
      const strValue = typeof value === 'string' ? value : '';

      if (textarea) {
        return (
          <div className="flex items-center gap-2 w-full">
            {chip && colors && renderChip()}
            <TextareaAutosize
              minRows={1}
              {...(changeHandler
                ? { value: strValue, onChange: changeHandler }
                : { defaultValue: strValue, readOnly: true })}
              placeholder={placeholder}
              className="flex-1 noDefaultStyle placeholder:text-gr"
              style={{
                outline: 'none',
                overflow: 'hidden',
                resize: 'none',
              }}
              onFocus={onFocus}
              onBlur={onBlur}
              ref={register?.ref}
            />
          </div>
        );
      }

      return (
        <div className="flex items-center gap-2 w-full">
          {chip && colors && renderChip()}
          <input
            type={inputType}
            {...(changeHandler
              ? { value: strValue, onChange: changeHandler }
              : { defaultValue: strValue, readOnly: true })}
            placeholder={placeholder}
            className="flex-1 placeholder:text-gr disabled:default"
            style={{ outline: 'none' }}
            onFocus={onFocus}
            onBlur={onBlur}
            ref={register?.ref}
            disabled={disabled}
          />
        </div>
      );
    }

    // chip이 있는 경우
    if (chip && colors) {
      // text도 있으면 함께 표시
      if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
        return (
          <div className="flex items-center gap-2">
            {renderChip()}
            {renderText()}
          </div>
        );
      }
      // chip만 표시
      return renderChip();
    }

    // text만 표시 (기존 동작)
    return renderText();
  };

  return (
    <div className="flex w-full Me_Body-3 border-t border-lg">
      <div className="w-[137px] bg-bg flex gap-2 p-3 cursor-default">
        <div className="text-sv">{label}</div>
        {required && <div className="text-sv">*</div>}
      </div>
      <div className="flex-1 flex items-center">
        <div
          className={`text-dg px-3 flex-1 flex items-center ${!isEditing || disabled ? 'cursor-default' : ''}`}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default InfoLabelValue;
