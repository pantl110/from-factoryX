"use client";

import { useState } from "react";

import Chip from "@/ui/chip";
import SearchInput from "@/ui/search-input";
import MiniBtn from "@/ui/mini-btn";
import FacilityTable from "./facility-table";

const SettingPage = () => {
  const [selectedTab, setSelectedTab] = useState<"system" | "master">("system");
  const [selectedChip, setSelectedChip] = useState<"equipment" | "partner">(
    "equipment"
  );
  const [selectedSystemChip, setSelectedSystemChip] = useState<
    "general" | "permission" | "subscription"
  >("general");

  return (
    <div className="max-w-[1400px] min-w-[1200px]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-8 pt-10 px-10">
          <h1 className="Heading-1 text-bl">설정</h1>
          <div className="flex gap-4 Heading-3 mb-3">
            <p
              className={`cursor-pointer ${selectedTab === "system" ? "text-dg" : "text-gr"}`}
              onClick={() => setSelectedTab("system")}
            >
              시스템 설정
            </p>
            <p
              className={`cursor-pointer ${selectedTab === "master" ? "text-dg" : "text-gr"}`}
              onClick={() => setSelectedTab("master")}
            >
              마스터 데이터 관리
            </p>
          </div>
        </div>
        {selectedTab === "system" && (
          <div className="flex gap-1 px-10 pb-5">
            <Chip
              text="일반"
              textColor={
                selectedSystemChip === "general" ? "text-bg" : "text-dg"
              }
              bgColor={
                selectedSystemChip === "general" ? "bg-dg" : "bg-transparent"
              }
              radius="rounded-full"
              borderColor="border-lg"
              onClick={() => setSelectedSystemChip("general")}
            />
            <Chip
              text="권한설정"
              textColor={
                selectedSystemChip === "permission" ? "text-bg" : "text-dg"
              }
              bgColor={
                selectedSystemChip === "permission" ? "bg-dg" : "bg-transparent"
              }
              radius="rounded-full"
              borderColor="border-lg"
              onClick={() => setSelectedSystemChip("permission")}
            />
            <Chip
              text="구독관리"
              textColor={
                selectedSystemChip === "subscription" ? "text-bg" : "text-dg"
              }
              bgColor={
                selectedSystemChip === "subscription"
                  ? "bg-dg"
                  : "bg-transparent"
              }
              radius="rounded-full"
              borderColor="border-lg"
              onClick={() => setSelectedSystemChip("subscription")}
            />
          </div>
        )}
        {selectedTab === "master" && (
          <>
            <div className="flex gap-1 px-10 pb-2">
              <Chip
                text="설비 관리"
                textColor={selectedChip === "equipment" ? "text-bg" : "text-dg"}
                bgColor={
                  selectedChip === "equipment" ? "bg-dg" : "bg-transparent"
                }
                radius="rounded-full"
                borderColor="border-lg"
                onClick={() => setSelectedChip("equipment")}
              />
              <Chip
                text="거래처 정보"
                textColor={selectedChip === "partner" ? "text-bg" : "text-dg"}
                bgColor={
                  selectedChip === "partner" ? "bg-dg" : "bg-transparent"
                }
                radius="rounded-full"
                borderColor="border-lg"
                onClick={() => setSelectedChip("partner")}
              />
            </div>
            <div className="flex items-center justify-between px-10 pb-4">
              <SearchInput />
              <div className="flex gap-1">
                <MiniBtn
                  text="추가"
                  textColor="text-dg"
                  borderColor="border-[#eeeeee]"
                />
                <MiniBtn text="삭제" textColor="text-red" bgColor="bg-red-8" />
              </div>
            </div>
          </>
        )}
        {selectedTab === "master" && selectedChip === "equipment" && (
          <FacilityTable />
        )}
      </div>
    </div>
  );
};

export default SettingPage;
