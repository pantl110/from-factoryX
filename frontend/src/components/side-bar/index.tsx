"use client";

import {
  ChartBar,
  Package,
  Warehouse,
  MoneyWavy,
  Files,
  Gear,
} from "@phosphor-icons/react/dist/ssr";
import SideBarItem from "@/components/side-bar/side-bar-item";
import FactoryXLogo from "@/ui/icons/factory-x-logo";

const SideBar = () => {
  return (
    <aside className="fixed left-0 top-0 w-64 h-screen flex flex-col border-r border-[#eeeeee] bg-white z-50">
      <div className="flex items-center h-[68px] pt-6 pr-4 pb-5 pl-6">
        <FactoryXLogo />
      </div>
      <div className="flex flex-col gap-1 px-2">
        <SideBarItem icon={ChartBar} label="대시보드" path="/dashboard" />
        <SideBarItem
          icon={Package}
          label="프로젝트관리"
          path="/project"
          hasDropdown={true}
          dropdownItems={[
            { label: "진행 중인 프로젝트", path: "/project/process" },
            { label: "보관된 프로젝트", path: "/project/completed" },
          ]}
        />
        <SideBarItem icon={Warehouse} label="재고관리" path="/stock" />
        <SideBarItem icon={MoneyWavy} label="세무/회계" path="/tax" />
        <SideBarItem icon={Files} label="문서함" path="/document" />
      </div>
      <div className="mt-auto px-2 mb-8">
        <SideBarItem icon={Gear} label="설정" path="/setting" />
      </div>
    </aside>
  );
};

export default SideBar;
