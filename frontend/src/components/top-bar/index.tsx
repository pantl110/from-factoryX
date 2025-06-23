"use client";

import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import usePageStatusStore, { PageStatusState } from "@/store/page-status-store";
import { topBarContentMap } from "./top-bar-content";

const TopBar = () => {
  const pageStatus = usePageStatusStore(
    (state: PageStatusState) => state.pageStatus,
  );

  const content =
    topBarContentMap[pageStatus || "default"]?.() || topBarContentMap.default();

  return (
    <header className="flex items-center justify-between w-full h-[60px] px-10">
      <div className="flex items-center gap-1">
        <p className="Re_Body-1 text-dg">프로젝트 관리</p>
        <CaretRight size={16} className="text-[#8c8c8c]" />
        <p className="Re_Body-1 text-dg">보관된 프로젝트</p>
      </div>
      {content}
    </header>
  );
};

export default TopBar;
