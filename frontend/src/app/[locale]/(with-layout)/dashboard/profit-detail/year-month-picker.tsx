'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CaretDown, CaretLeft, CaretRight } from '@phosphor-icons/react';
import Dropdown from '@/ui/dropdown/dropdown';
import { parseMonth } from './utils';

interface YearMonthPickerProps {
  value: string; // 'YYYY-MM'
  onChange: (value: string) => void;
  min?: string; // 선택 가능 하한 'YYYY-MM'
  max?: string; // 선택 가능 상한 'YYYY-MM'
  align?: 'left' | 'right'; // 드롭다운 정렬 (기본 left)
}

const YearMonthPicker = ({
  value,
  onChange,
  min,
  max,
  align = 'left',
}: YearMonthPickerProps) => {
  const t = useTranslations('dashboard.profitDetail');
  const { year, month } = parseMonth(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState(Number(year));

  const handleOpen = () => {
    setViewYear(Number(year));
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (m: number) => {
    onChange(`${viewYear}-${String(m).padStart(2, '0')}`);
    setIsOpen(false);
  };

  const isDisabled = (m: number) => {
    const ym = `${viewYear}-${String(m).padStart(2, '0')}`;
    if (min && ym < min) return true;
    if (max && ym > max) return true;
    return false;
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="flex items-center gap-1 px-3 h-9 rounded-lg border border-lg Re_Body-1 text-dg hover:bg-bg cursor-pointer"
      >
        {t('monthLabel', { year, month })}
        <CaretDown size={16} className="text-gr" />
      </button>

      {isOpen && (
        <div
          className={`absolute z-30 top-11 ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          <Dropdown
            onClose={() => setIsOpen(false)}
            width="w-[260px]"
            maxHeight=""
          >
            <div className="flex items-center justify-between px-1 py-1">
              <button
                onClick={() => setViewYear((y) => y - 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg cursor-pointer"
              >
                <CaretLeft size={16} className="text-sv" />
              </button>
              <span className="Me_Body-2 text-dg">{viewYear}</span>
              <button
                onClick={() => setViewYear((y) => y + 1)}
                className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-bg cursor-pointer"
              >
                <CaretRight size={16} className="text-sv" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 p-1">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isSelected = Number(year) === viewYear && month === m;
                const isMonthDisabled = isDisabled(m);
                return (
                  <button
                    key={m}
                    disabled={isMonthDisabled}
                    onClick={() => handleSelect(m)}
                    className={`h-9 rounded-md Re_Body-2 transition-colors ${
                      isSelected
                        ? 'bg-primary text-wh'
                        : isMonthDisabled
                          ? 'text-lg cursor-not-allowed'
                          : 'text-dg hover:bg-bg cursor-pointer'
                    }`}
                  >
                    {t('monthOnly', { month: m })}
                  </button>
                );
              })}
            </div>
          </Dropdown>
        </div>
      )}
    </div>
  );
};

export default YearMonthPicker;
