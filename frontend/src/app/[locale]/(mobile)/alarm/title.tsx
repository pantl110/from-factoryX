'use client';

import { useState } from 'react';
import MoBtn from '@/ui/mo-btn';
import { CaretDown } from '@phosphor-icons/react';
import React from 'react';
import { useTranslations } from 'next-intl';
import DeliveryFilterDropdown from './delivery-filter-dropdown';
import AccountFilterDropdown from './account-filter-dropdown';

interface TitleProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  delivery?: boolean;
  account?: boolean;
  selectedFilter?: string;
  onFilterChange?: (filter: string) => void;
}

const Title = ({
  icon,
  title,
  count,
  delivery = false,
  account = false,
  selectedFilter,
  onFilterChange,
}: TitleProps) => {
  const t = useTranslations('mobile.alarm.filter');
  const tList = useTranslations('tax.list');
  const deliveryFilterLabel = selectedFilter || t('today');
  const accountFilterLabel = selectedFilter || tList('status.overdue');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="flex items-center justify-between pr-7 h-10">
      <div className="flex items-center gap-1.5 px-7">
        {React.cloneElement(
          icon as React.ReactElement<{ size: number; className?: string }>,
          {
            size: 20,
            className: 'text-primary',
          }
        )}
        <h4 className="m-Heading-4b">{title}</h4>
        <div className="flex items-center justify-center w-[22px] h-[22px] rounded-full bg-green-8">
          <h6 className="m-Heading-6 text-primary">{count}</h6>
        </div>
      </div>
      {delivery && (
        <div className="relative">
          <MoBtn
            text={deliveryFilterLabel}
            variant="outline"
            width="w-30"
            icon={<CaretDown weight="fill" />}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            align="justify-between"
          />
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 z-10">
              <DeliveryFilterDropdown
                onSelect={(filter: string) => {
                  onFilterChange?.(filter);
                  setIsDropdownOpen(false);
                }}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>
          )}
        </div>
      )}
      {account && (
        <div className="relative">
          <MoBtn
            text={accountFilterLabel}
            variant="outline"
            width="w-30"
            icon={<CaretDown weight="fill" />}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            align="justify-between"
          />
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 z-10">
              <AccountFilterDropdown
                onSelect={(filter: string) => {
                  onFilterChange?.(filter);
                  setIsDropdownOpen(false);
                }}
                onClose={() => setIsDropdownOpen(false)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Title;
