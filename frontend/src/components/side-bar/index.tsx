'use client';

import {
  ChartBar,
  Package,
  Warehouse,
  MoneyWavy,
  Files,
  Gear,
  CaretDoubleLeft,
  CaretDoubleRight,
} from '@phosphor-icons/react/dist/ssr';
import SideBarItem from '@/components/side-bar/side-bar-item';
import PantlLogo from '@/ui/icons/pantl-logo';
import { useRouter } from '@/i18n/navigation';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

interface SideBarProps {
  onVisibilityChange?: (visible: boolean) => void;
}

const SideBar = ({ onVisibilityChange }: SideBarProps) => {
  const t = useTranslations('navigation');
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false); // 사용자가 직접 접은 상태

  // 접힘 상태 localStorage에서 복원
  useEffect(() => {
    if (localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  // 접힘 상태 변경 시 저장
  useEffect(() => {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
  }, [isCollapsed]);

  // 사이드바 상태가 변경될 때마다 부모 컴포넌트에 알림
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(!isCollapsed);
    }
  }, [isCollapsed, onVisibilityChange]);

  return (
    <>
      {/* 접힌 상태일 때 펼치기 버튼 */}
      {isCollapsed && (
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          aria-label={t('expandSidebar')}
          title={t('expandSidebar')}
          className="fixed left-3 top-4 z-50 flex items-center justify-center w-8 h-8 rounded-md border border-lg bg-wh text-dg hover:bg-bg transition-colors"
        >
          <CaretDoubleRight size={18} />
        </button>
      )}

      <aside
        className={`fixed left-0 top-0 bottom-0 w-60 flex flex-col border-r border-lg bg-bg z-50 transition-transform duration-300 ease-in-out ${
          isCollapsed ? '-translate-x-full' : 'translate-x-0'
        }`}
      >
        <div className="relative flex items-center pt-6 pb-6 px-6">
          <div
            className="cursor-pointer w-full flex justify-start"
            onClick={() => {
              router.push('/dashboard');
            }}
          >
            <PantlLogo className="w-[70%] h-auto" />
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            aria-label={t('collapseSidebar')}
            title={t('collapseSidebar')}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded-md text-sv hover:bg-lg transition-colors"
          >
            <CaretDoubleLeft size={18} />
          </button>
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
