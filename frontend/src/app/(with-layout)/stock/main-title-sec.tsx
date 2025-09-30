'use client';

import MiniBtn from '@/ui/mini-btn';
import { StockTabType } from './types';
import { CaretDown } from '@phosphor-icons/react';
import ProductAddDropdown from './product/modals/product-add-dropdown';
import MaterialAddDropdown from './material/modals/material-add-dropdown';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';

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
  const factoryId = useMemberStore((state) => state.factoryId);
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  const handleTabClick = (tab: StockTabType) => {
    onTabChange(tab);
  };

  const handleExcelDownload = () => {
    try {
      const filename =
        selectedTab === 'product'
          ? 'product-excel.xlsx'
          : 'material-excel.xlsx';

      const downloadName =
        selectedTab === 'product'
          ? '품목_등록_양식.xlsx'
          : '자재_등록_양식.xlsx';

      // 파일 다운로드
      const link = document.createElement('a'); // 다운로드 링크 생성
      link.href = `/${filename}`;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert('파일 다운로드에 실패했습니다.');
    }
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
            disabled={!factoryId || isViewer || !hasSubscription()}
            onClick={handleExcelDownload}
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
              disabled={!factoryId || isViewer || !hasSubscription()}
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
