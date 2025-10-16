import Modal from '@/ui/modal/modal';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import Input from '@/ui/input';
import { CaretDown, Equals, WarningCircle } from '@phosphor-icons/react';
import MiniBtn from '@/ui/mini-btn';

interface AddUnitModalProps {
  onClose: () => void;
  addUnitType: 'material' | 'product';
}

export const AddUnitModal = ({ onClose, addUnitType }: AddUnitModalProps) => {
  const { register, handleSubmit, watch } = useForm();
  const [unitValue, setUnitValue] = useState('');

  // 단위 필드 값 감시
  const watchedUnit = watch('unit');
  const watchedConversionUnit = watch('conversionUnit');

  const onSubmit = (data: any) => {
    console.log(data);
    onClose();
  };

  return (
    <Modal title="단위 추가" width="w-[800px]" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex gap-2">
            <Input
              placeholder={
                addUnitType === 'material'
                  ? '자재명을 입력하세요.'
                  : '제품명을 입력하세요.'
              }
              label={addUnitType === 'material' ? '자재명' : '제품명'}
              {...register('name', { required: true })}
            />
            <Input
              placeholder={
                addUnitType === 'material'
                  ? '자재코드을 입력하세요.'
                  : '제품코드을 입력하세요.'
              }
              label={addUnitType === 'material' ? '자재코드' : '제품코드'}
              {...register('code', { required: true })}
            />
            <Input
              placeholder={'단위를 입력하세요.'}
              label="단위"
              {...register('unit', { required: true })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Input
              label="기준단위"
              value={watchedUnit || ''}
              disabledReadOnly
              placeholder=""
            />
            <Input
              placeholder={'변환단위을 입력하세요.'}
              label="변환단위"
              {...register('conversionUnit', { required: true })}
            />
          </div>

          <div className="px-4 py-2 flex gap-1 rounded-[8px] bg-bg items-center">
            <div className="w-4 h-4 flex items-center justify-center">
              <WarningCircle size={16} className="text-sv" />
            </div>
            <span className="text-sv Re_Body-2">
              단위와 기준단위는 같은 의미입니다.
            </span>
          </div>
        </div>

        {/* 변환식 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-3 items-end">
            <div className="flex gap-2 flex-1 items-end">
              <div className="flex-1">
                <Input
                  placeholder={'숫자를 입력하세요.'}
                  label="변환식"
                  {...register('standardUnit', { required: true })}
                />
              </div>
              <div className="flex-[0.5]">
                <Input
                  value={watchedUnit || ''}
                  disabledReadOnly
                  placeholder=""
                />
              </div>
            </div>
            <div className="flex justify-center pb-[19px]">
              <Equals size={16} className="text-sv" />
            </div>
            <div className="flex gap-2 flex-1">
              <div className="flex-1">
                <Input
                  placeholder={'숫자를 입력하세요.'}
                  {...register('conversionFormula', { required: true })}
                />
              </div>
              <div className="flex-[0.5]">
                <Input
                  value={watchedConversionUnit || ''}
                  disabledReadOnly
                  placeholder=""
                />
              </div>
            </div>
            <div className="flex-[0.5] flex flex-col gap-2">
              <div className="flex items-center gap-1 h-5">
                <label className="Me_Body-1 text-dg">소수점 규칙</label>
              </div>
              <MiniBtn
                text="0"
                variant="whiteOutline"
                height="h-12"
                icon={CaretDown}
                iconPosition="right"
                justifyBetween={true}
                width="w-full"
              />
            </div>
          </div>

          <div className="px-4 py-2 flex gap-1 rounded-[8px] bg-bg items-center">
            <span className="text-sv Re_Body-2">
              단위와 기준단위는 같은 의미입니다.
            </span>
          </div>
        </div>
      </form>
    </Modal>
  );
};
