import Chip from './chip';
import React, { ChangeEvent, ReactNode } from 'react';
import {
  InventoryStatusType,
  InventoryStatusColorMap,
  TaxDocumentType,
  TaxDocumentTypeColorMap,
  EquipmentStatusType,
  EquipmentStatusColorMap,
  MaterialType,
  MaterialTypeColorMap,
} from '@/types/status-type';
import TextareaAutosize from 'react-textarea-autosize';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InfoLabelValueProps {
  label: string;
  value?: ReactNode;
  chip?: {
    status:
      | InventoryStatusType
      | TaxDocumentType
      | EquipmentStatusType
      | MaterialType
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
  const colors = chip
    ? chip.status === 'danger'
      ? { bgColor: 'bg-red-8', textColor: 'text-red' }
      : chip.status in TaxDocumentTypeColorMap
        ? TaxDocumentTypeColorMap[chip.status as TaxDocumentType]
        : chip.status in EquipmentStatusColorMap
          ? EquipmentStatusColorMap[chip.status as EquipmentStatusType]
          : chip.status in MaterialTypeColorMap
            ? MaterialTypeColorMap[chip.status as MaterialType]
            : InventoryStatusColorMap[chip.status as InventoryStatusType]
    : null;

  const renderChip = () => {
    if (!chip || !colors) return null;

    return (
      <Chip
        text={
          chip.status === 'sales'
            ? '매출'
            : chip.status === 'purchase'
              ? '매입'
              : chip.status === 'standby'
                ? '가동 대기'
                : chip.status === 'running'
                  ? '가동 중'
                  : chip.status === 'rawMaterial'
                    ? '원자재'
                    : chip.status === 'subMaterial'
                      ? '부자재'
                      : chip.status === 'danger'
                        ? '위험'
                        : chip.status // 재고 상태는 그대로 표시 (충분, 부족)
        }
        bgColor={colors.bgColor}
        textColor={colors.textColor}
        radius={
          chip.status === 'sales' ||
          chip.status === 'purchase' ||
          chip.status === 'standby' ||
          chip.status === 'running'
            ? 'rounded'
            : 'rounded-[18px]'
        }
        padding={
          chip.status === 'sales' ||
          chip.status === 'purchase' ||
          chip.status === 'standby' ||
          chip.status === 'running'
            ? 'px-3'
            : 'px-2.5'
        }
        height={
          chip.status === 'sales' ||
          chip.status === 'purchase' ||
          chip.status === 'standby' ||
          chip.status === 'running'
            ? 'h-8'
            : 'h-6.5'
        }
      />
    );
  };

  const renderText = () => {
    // value가 없거나 빈 문자열이면 placeholder 표시
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return <span className="text-gr Me_Body-1">{placeholder || '-'}</span>;
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
              className="flex-1 noDefaultStyle"
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
    <div className="flex w-full Me_Body-1 border-t border-lg">
      <div className="w-[137px] bg-lg-table flex gap-2 p-3 cursor-default">
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
