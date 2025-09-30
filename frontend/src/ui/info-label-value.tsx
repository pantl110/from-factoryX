import Chip from './chip';
import React, { ChangeEvent, ReactNode } from 'react';
import {
  InventoryStatusType,
  InventoryStatusColorMap,
  TaxDocumentType,
  TaxDocumentTypeColorMap,
  EquipmentStatusType,
  EquipmentStatusColorMap,
} from '@/types/status-type';
import TextareaAutosize from 'react-textarea-autosize';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InfoLabelValueProps {
  label: string;
  value?: ReactNode;
  chip?: {
    status: InventoryStatusType | TaxDocumentType | EquipmentStatusType;
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
    ? chip.status in TaxDocumentTypeColorMap
      ? TaxDocumentTypeColorMap[chip.status as TaxDocumentType]
      : chip.status in EquipmentStatusColorMap
        ? EquipmentStatusColorMap[chip.status as EquipmentStatusType]
        : InventoryStatusColorMap[chip.status as InventoryStatusType]
    : null;

  const renderContent = () => {
    // 수정 모드인 경우
    if (isEditing) {
      if (textarea) {
        return (
          <TextareaAutosize
            minRows={1}
            value={typeof value === 'string' ? value : ''}
            placeholder={placeholder}
            onChange={register?.onChange || handleChange || onChange}
            className="w-full noDefaultStyle"
            style={{ outline: 'none' }}
            onFocus={onFocus}
            onBlur={onBlur}
            ref={register?.ref}
          />
        );
      }

      return (
        <div className="flex items-center w-full">
          <input
            type={inputType}
            value={typeof value === 'string' ? value : ''}
            placeholder={placeholder}
            onChange={register?.onChange || handleChange || onChange}
            className="w-full placeholder:text-gr disabled:default"
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
                    : chip.status // 재고 상태는 그대로 표시 (충분, 부족)
          }
          bgColor={colors.bgColor}
          textColor={colors.textColor}
        />
      );
    }

    // value가 없거나 빈 문자열이면 placeholder 표시
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return <span className="text-gr Me_Body-1">{placeholder || '-'}</span>;
    }

    return value;
  };

  return (
    <div className="flex w-full Me_Body-1 border-t border-lg">
      <div className="w-[137px] bg-lg-table flex gap-2 p-3 cursor-default">
        <div className="text-sv">{label}</div>
        {required && isEditing && <div className="text-sv">*</div>}
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
