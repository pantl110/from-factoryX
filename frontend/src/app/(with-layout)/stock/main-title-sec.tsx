'use client';

import MiniBtn from '@/ui/mini-btn';
import { StockTabType } from './types';
import { CaretDown } from '@phosphor-icons/react';
import ProductAddDropdown from './product/modals/product-add-dropdown';
import MaterialAddDropdown from './material/modals/material-add-dropdown';
import useFactoryStore from '@/store/factory-store';

interface MainTitleSecProps {
  selectedTab: StockTabType;
  onTabChange: (tab: StockTabType) => void;
  onProductAddDropdownOpen: (isOpen: boolean) => void;
  isProductAddDropdownOpen: boolean;
  onMaterialAddDropdownOpen: (isOpen: boolean) => void;
  isMaterialAddDropdownOpen: boolean;
  onOpenExcelModal: () => void;
  onOpenCreatePanel: () => void;
  onOpenClientInfoModal: () => void;
}

const MainTitleSec = ({
  selectedTab,
  onTabChange,
  onProductAddDropdownOpen,
  isProductAddDropdownOpen,
  onMaterialAddDropdownOpen,
  isMaterialAddDropdownOpen,
  onOpenExcelModal,
  onOpenCreatePanel,
  onOpenClientInfoModal,
}: MainTitleSecProps) => {
  const factoryId = useFactoryStore((state) => state.factoryId);
  const handleTabClick = (tab: StockTabType) => {
    onTabChange(tab);
  };

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <h1 className="Heading-1 text-dg">재고 관리</h1>
        <div className="flex gap-2.5">
          <MiniBtn
            text="엑셀 양식 다운로드"
            textColor="text-dg"
            borderColor="border-lg"
            hoverColor="hover:bg-bg"
            disabled={!factoryId}
          />
          <div className="relative">
            <MiniBtn
              bgColor="bg-primary"
              textColor="text-wh"
              text={
                selectedTab === 'product' ? '품목 추가하기' : '자재 추가하기'
              }
              icon={CaretDown}
              iconPosition="right"
              iconColor="text-white"
              hoverColor="hover:bg-primary-hover"
              onClick={() =>
                selectedTab === 'product'
                  ? onProductAddDropdownOpen(true)
                  : onMaterialAddDropdownOpen(true)
              }
              disabled={!factoryId}
            />

            {isProductAddDropdownOpen && (
              <div className="absolute right-0 top-12 z-10">
                <ProductAddDropdown
                  onClose={() => onProductAddDropdownOpen(false)}
                  onOpenExcelModal={onOpenExcelModal}
                  onOpenCreatePanel={onOpenCreatePanel}
                />
              </div>
            )}
            {isMaterialAddDropdownOpen && (
              <div className="absolute right-0 top-12 z-10">
                <MaterialAddDropdown
                  onClose={() => onMaterialAddDropdownOpen(false)}
                  onOpenExcelModal={onOpenExcelModal}
                  onOpenClientInfoModal={onOpenClientInfoModal}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-4 Heading-3">
        <button
          type="button"
          className={`${selectedTab === 'product' ? 'text-bl' : 'text-gr'} cursor-pointer`}
          onClick={() => handleTabClick('product')}
        >
          품목
        </button>
        <button
          type="button"
          className={`${selectedTab === 'material' ? 'text-bl' : 'text-gr'} cursor-pointer`}
          onClick={() => handleTabClick('material')}
        >
          원자재
        </button>
      </div>
    </div>
  );
};

export default MainTitleSec;
