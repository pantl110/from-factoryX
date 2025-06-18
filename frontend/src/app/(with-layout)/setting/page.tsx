"use client";

import { useState } from "react";
import SystemSetting from "./system-setting";
import MasterData from "./master-data";

const SettingPage = () => {
  const [selectedTab, setSelectedTab] = useState<"system" | "master">("system");

  return (
    <div className="max-w-[1400px] min-w-[1200px]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-8 pt-10 px-10">
          <h1 className="Heading-1 text-bl">설정</h1>
          <div className="flex gap-4 Heading-3 mb-3">
            <button
              type="button"
              className={`cursor-pointer ${selectedTab === "system" ? "text-dg" : "text-gr"}`}
              onClick={() => setSelectedTab("system")}
            >
              시스템 설정
            </button>
            <button
              type="button"
              className={`cursor-pointer ${selectedTab === "master" ? "text-dg" : "text-gr"}`}
              onClick={() => setSelectedTab("master")}
            >
              마스터 데이터 관리
            </button>
          </div>
        </div>
        {selectedTab === "system" && <SystemSetting />}
        {selectedTab === "master" && <MasterData />}
      </div>
    </div>
  );
};

export default SettingPage;
