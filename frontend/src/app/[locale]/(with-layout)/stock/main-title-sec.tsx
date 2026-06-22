'use client';

import MiniBtn from '@/ui/mini-btn';
import { StockTabType } from './types';
import { CaretDown } from '@phosphor-icons/react';
import ProductAddDropdown from './product/modals/product-add-dropdown';
import MaterialAddDropdown from './material/modals/material-add-dropdown';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useLocale, useTranslations } from 'next-intl';

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
  const t = useTranslations('stock');
  const locale = useLocale();
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
      // 로케일에 따라 다른 파일명 사용
      const filename =
        selectedTab === 'product'
          ? locale === 'en'
            ? 'product-excel-en.xlsx'
            : 'product-excel.xlsx'
          : locale === 'en'
            ? 'material-excel-en.xlsx'
            : 'material-excel.xlsx';

      const downloadName =
        selectedTab === 'product'
          ? t('downloadFileName.product')
          : t('downloadFileName.material');

      // 파일 다운로드
      const link = document.createElement('a'); // 다운로드 링크 생성
      link.href = `/${filename}`;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      alert(t('errors.downloadFailed'));
    }
  };

  return (
    <div className="flex flex-col gap-8 pt-10 pr-10 pl-10">
      <div className="flex items-center justify-between">
        <h1 className="Heading-1 text-dg">{t('title')}</h1>
        <div className="flex gap-2.5">
          <MiniBtn variant="outline"
            text={
              selectedTab === 'product'
                ? t('excelDownloadButtonProduct')
                : t('excelDownloadButtonMaterial')
            }
            disabled={!factoryId || isViewer || !hasSubscription()}
            onClick={handleExcelDownload}
          />
          <div className="relative">
            <MiniBtn variant="primary"
              text={
                selectedTab === 'product'
                  ? t('addProductButton')
                  : t('addMaterialButton')
              }
              icon={CaretDown}
              iconPosition="right"
              iconColor="text-white"
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
          {t('tabs.product')}
        </button>
        <button
          type="button"
          className={`${selectedTab === 'material' ? 'text-bl' : 'text-gr'} cursor-pointer`}
          onClick={() => handleTabClick('material')}
        >
          {t('tabs.material')}
        </button>
      </div>
    </div>
  );
};

export default MainTitleSec;
