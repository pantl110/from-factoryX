'use client';

import {
  ChartBar,
  Package,
  Warehouse,
  MoneyWavy,
  Files,
  Gear,
} from '@phosphor-icons/react/dist/ssr';
import SideBarItem from '@/components/side-bar/side-bar-item';
import PantlLogo from '@/ui/icons/pantl-logo';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface SideBarProps {
  onVisibilityChange?: (visible: boolean) => void;
}

const SideBar = ({ onVisibilityChange }: SideBarProps) => {
  const t = useTranslations('navigation');
  const router = useRouter();
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const isProductionPage = pathname.startsWith('/production/'); // production 페이지인지 확인
  const shouldHide = isProductionPage && !isHovered; // production 페이지이고 호버되지 않았으면 숨김

  // 사이드바 상태가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(!shouldHide);
    }
  }, [shouldHide, onVisibilityChange]);

  return (
    <>
      {/* Production 페이지에서 마우스 감지 영역 */}
      {isProductionPage && (
        <div
          className="fixed left-0 top-0 w-7 h-screen z-40" // width가 40px 미만이어야 함! // 사이드바 사라졌을 때 여백이 40px
          onMouseEnter={() => setIsHovered(true)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-60 flex flex-col border-r border-lg bg-bg z-50 transition-transform duration-300 ease-in-out ${
          shouldHide ? '-translate-x-full' : 'translate-x-0'
        }`}
        onMouseLeave={() => isProductionPage && setIsHovered(false)}
      >
        <div className="flex items-center pt-6 pb-6 px-6">
          <div
            className="cursor-pointer w-full flex justify-start"
            onClick={() => {
              router.push('/dashboard');
            }}
          >
            <PantlLogo className="w-[70%] h-auto" />
          </div>
        </div>
        <div className="flex flex-col gap-1 px-2">
          <SideBarItem
            icon={ChartBar}
            label={t('dashboard')}
            path="/dashboard"
          />
          <SideBarItem
            icon={Package}
            label={t('project')}
            path="/project"
            hasDropdown={true}
            dropdownItems={[
              { label: t('projectDropdown.process'), path: '/project/process' },
              {
                label: t('projectDropdown.completed'),
                path: '/project/completed',
              },
            ]}
          />
          <SideBarItem icon={Warehouse} label={t('stock')} path="/stock" />
          <SideBarItem
            icon={MoneyWavy}
            label={t('tax')}
            path="/tax"
            hasDropdown={true}
            dropdownItems={[
              { label: t('taxDropdown.draft'), path: '/tax/draft' },
              { label: t('taxDropdown.list'), path: '/tax/list' },
            ]}
          />
          <SideBarItem icon={Files} label={t('document')} path="/document" />
        </div>
        <div className="mt-auto px-2 mb-8">
          <SideBarItem icon={Gear} label={t('setting')} path="/setting" />
        </div>
      </aside>
    </>
  );
};

export default SideBar;
