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
import FactoryXLogo from '@/ui/icons/factory-x-logo';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

interface SideBarProps {
  onVisibilityChange?: (visible: boolean) => void;
}

const SideBar = ({ onVisibilityChange }: SideBarProps) => {
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
        className={`fixed left-0 top-0 bottom-0 w-64 flex flex-col border-r border-lg bg-white z-50 transition-transform duration-300 ease-in-out ${
          shouldHide ? '-translate-x-full' : 'translate-x-0'
        }`}
        onMouseLeave={() => isProductionPage && setIsHovered(false)}
      >
        <div className="flex items-center h-[68px] pt-6 pr-4 pb-5 pl-6">
          <div
            className="cursor-pointer"
            onClick={() => {
              router.push('/dashboard');
            }}
          >
            <FactoryXLogo />
          </div>
        </div>
        <div className="flex flex-col gap-1 px-2">
          <SideBarItem icon={ChartBar} label="현황판" path="/dashboard" />
          <SideBarItem
            icon={Package}
            label="PO 관리"
            path="/project"
            hasDropdown={true}
            dropdownItems={[
              { label: '진행 중인 프로젝트', path: '/project/process' },
              { label: '보관된 프로젝트', path: '/project/completed' },
            ]}
          />
          <SideBarItem icon={Warehouse} label="재고 관리" path="/stock" />
          <SideBarItem
            icon={MoneyWavy}
            label="세무 관리"
            path="/tax"
            hasDropdown={true}
            dropdownItems={[
              { label: '세금계산서 내역', path: '/tax/list' },
              { label: '세금계산서 임시보관함', path: '/tax/draft' },
              { label: '현금영수증', path: '/tax/receipt' },
            ]}
          />
          <SideBarItem icon={Files} label="문서함" path="/document" />
        </div>
        <div className="mt-auto px-2 mb-8">
          <SideBarItem icon={Gear} label="설정" path="/setting" />
        </div>
      </aside>
    </>
  );
};

export default SideBar;
