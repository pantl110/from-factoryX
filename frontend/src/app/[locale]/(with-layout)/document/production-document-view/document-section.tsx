'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import ProductionTableItem from './production-table-item';
import CommentItem from './comment-item';
import TextareaAutosize from 'react-textarea-autosize';
import { WorkInstructionDetailPlanModel } from '@/types/data-model';
import { formatISODateTime } from '@/utils';

interface DocumentSectionProps {
  grouped: Record<string, WorkInstructionDetailPlanModel[]>;
  plansData: WorkInstructionDetailPlanModel[];
  isOnlyRead: boolean;
  value: string;
  setValue: (value: string) => void;
  onMemoChange?: (memo: string) => void;
}

export const DocumentSection = ({
  grouped,
  plansData,
  isOnlyRead,
  value,
  setValue,
  onMemoChange,
}: DocumentSectionProps) => {
  const t = useTranslations('document');
  const tCommon = useTranslations('common');

  return (
    <>
      {/* 생산제품 - 프로젝트별로 표 분리 */}
      <div className="flex flex-col gap-6">
        {Object.entries(grouped).map(([projectName, items]) => (
          <div key={projectName} className="flex flex-col gap-3">
            <h3 className="Heading-3 h-10 items-center flex">{projectName}</h3>
            <div>
              <div className="w-full h-12 flex items-center bg-bg Me_Body-1 rounded text-sv cursor-default">
                <p className="flex-[1.4] px-3">{tCommon('productName')}</p>
                <p className="flex-1 px-3">{tCommon('specification')}</p>
                <p className="flex-1 px-3">{tCommon('unit')}</p>
                <p className="flex-[0.8] px-3">
                  {tCommon('productionQuantity')}
                </p>
                <p className="flex-1 px-3">{tCommon('productionEquipment')}</p>
                <p className="flex-1 px-3">{tCommon('productionTime')}</p>
              </div>
              {items.map((item, index) => (
                <ProductionTableItem
                  key={item.id ?? `${projectName}-${index}`}
                  productName={item.product_name}
                  spec={item.product_spec}
                  unit={item.product_unit}
                  productionQuantity={item.quantity || 0}
                  machine={item.equipment_name || '-'}
                  productionTime={
                    formatISODateTime(item.start_date)?.split(' ')[1] || null
                  }
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 특이사항 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">
          {t('specialNotes')}
        </h3>
        {plansData
          .filter(
            (item, index, self) =>
              index ===
              self.findIndex((t) => t.product_code === item.product_code)
          )
          .map((item, index) => (
            <CommentItem
              key={item.id ?? `${item.product_code}-${index}`}
              title={item.product_name}
              comment={item.product_note || '-'}
            />
          ))}
      </div>

      {/* 메모 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">{t('memo')}</h3>
        <TextareaAutosize
          placeholder={isOnlyRead ? '-' : t('memoPlaceholder')}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            if (onMemoChange) onMemoChange(v);
          }}
          className={`w-full print:hidden ${isOnlyRead ? 'cursor-default !border-lg focus:!border-lg' : 'focus:!border-primary'}`}
          minRows={6}
          readOnly={isOnlyRead}
        />
        <div className="textarea hidden print:block whitespace-pre-wrap w-full min-h-50">
          {value}
        </div>
      </div>
    </>
  );
};
