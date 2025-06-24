"use client";

import MiniBtn from "@/ui/mini-btn";
import ProductionTable from "./production-table";
import { useState } from "react";
import ProductionDocumentView from "../../document/production-document-view";
import OverlayView from "@/ui/ovelay-view";
import { X, PrinterIcon } from "@phosphor-icons/react/dist/ssr";

const TodayProductionSchedule = () => {
  const [isPrintOverlayOpen, setIsPrintOverlayOpen] = useState(false);

  return (
    <>
      <div>
        <div className="flex justify-between items-center">
          <h3 className="Heading-3">오늘의 생산 일정</h3>
          <MiniBtn
            text="생산지시서 출력하기"
            textColor="text-dg"
            borderColor="border-lg"
            onClick={() => {
              setIsPrintOverlayOpen(true);
            }}
          />
        </div>
        <div className="mt-3 overflow-x-auto">
          <ProductionTable />
        </div>
      </div>

      {/* overlay */}
      {isPrintOverlayOpen && (
        <OverlayView onClose={() => setIsPrintOverlayOpen(false)}>
          {/* <div className="py-5 px-10">
            <ProductionDocumentView />
          </div> */}

          <div className="w-full flex flex-col gap-6 p-8">
            <div className="flex justify-between h-13 border-b border-lg">
              <h3 className="Heading-3">생산지시서</h3>
              <button
                className="w-10 h-10 flex justify-center items-center cursor-pointer"
                onClick={() => setIsPrintOverlayOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="pb-6 w-full flex justify-between border-b border-lg">
              <div>
                <h2 className="Heading-2">생산지서를 출력하시겠어요?</h2>
                <div className="mt-2.5 Me_Body-3 text-gr">
                  출력 전, 생산지시서 내용을 한 번 더 확인해 주세요.
                </div>
              </div>
              <MiniBtn
                text="생산지시서 출력하기"
                textColor="text-wh"
                bgColor="bg-primary"
                hoverColor="bg-primary-hover"
                icon={PrinterIcon}
                iconColor="text-wh"
              />
            </div>
            <ProductionDocumentView />
          </div>
        </OverlayView>
      )}
    </>
  );
};

export default TodayProductionSchedule;
