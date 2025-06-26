"use client";

import { useEffect } from "react";
import usePageStatusStore from "@/store/page-status-store";
import SystemSetting from "./system-setting";
import MasterData from "./master-data";

const SettingPage = () => {
  const { settingTab, setSettingTab } = usePageStatusStore();

  useEffect(() => {
    if (!settingTab) {
      setSettingTab("system"); // 초기 탭을 시스템 설정으로 설정
    }
  }, [settingTab, setSettingTab]);

  return (
    <div className="max-w-[1400px] min-w-[1200px]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-8 mt-10 mx-10 border-b border-lg">
          <h1 className="Heading-1 text-bl">설정</h1>
          <div className="flex gap-4 Heading-3 mb-3">
            <button
              type="button"
              className={`cursor-pointer ${settingTab === "system" ? "text-dg" : "text-gr"}`}
              onClick={() => setSettingTab("system")}
            >
              시스템 설정
            </button>
            <button
              type="button"
              className={`cursor-pointer ${settingTab === "master" ? "text-dg" : "text-gr"}`}
              onClick={() => setSettingTab("master")}
            >
              마스터 데이터 관리
            </button>
          </div>
        </div>
        {settingTab === "system" && <SystemSetting />}
        {settingTab === "master" && <MasterData />}
      </div>
    </div>
  );
};

export default SettingPage;
