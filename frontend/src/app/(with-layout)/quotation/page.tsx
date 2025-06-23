"use client";

import { useState } from "react";
import Chip from "@/ui/chip";
import {
  ArrowLineLeftIcon,
  ArrowLineRightIcon,
  CaretDownIcon,
} from "@phosphor-icons/react/dist/ssr";
import RequestInfo from "./request-info";
import ButtonSection from "./button-section";
import InputSection from "./input-section";
import PreviewImage from "./image-preview";
import History from "./history";
import EmailView from "./modals/email-view";
import OverlayView from "@/ui/ovelay-view";
import PrintView from "./modals/print-view";
import { ProductProps } from "./types";
import StartProductionModal from "./modals/start-production-modal";

const QuotationPage = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<"quotation" | "history">(
    "quotation",
  );
  // 오른쪽 패널 확장 상태
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false);
  // 선택된 품목 상태 -> 히스토리 보여주기
  const [selectedProduct, setSelectedProduct] = useState<ProductProps | null>(
    null,
  );
  // 모달 상태
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isStartProductionModalOpen, setIsStartProductionModalOpen] =
    useState(false);

  const handleProductClick = (product: ProductProps) => {
    setSelectedProduct(product);
    setActiveTab("history"); // 품목 클릭 시 히스토리탭 활성화
    setIsRightPanelExpanded(false); // 히스토리탭 활성화 시 오른쪽 패널 다시 축소
  };
  const activateQuotationTab = () => {
    setSelectedProduct(null);
    setActiveTab("quotation"); // 견적요청서탭 활성화
    setIsRightPanelExpanded(false); // 견적요청서탭 활성화 시 오른쪽 패널 다시 축소
  };

  return (
    <>
      <div className="pt-7 pl-10 h-[calc(100vh-61px)] flex flex-col">
        <div className="flex gap-1 mb-4 pr-10">
          <div className="flex-1 gap-1">
            <Chip
              text="견적 협의"
              containerWidth="w-[150px]"
              bgColor="bg-yellow-8"
              textColor="text-yellow"
              icon={<CaretDownIcon size={12} />}
            />
            <h1 className="Heading-1 mt-2">플라스틱이 좋아</h1>
          </div>
          <ButtonSection
            onEmailClick={() => setIsEmailOpen(true)}
            onPrintClick={() => setIsPrintOpen(true)}
            onStartProductionClick={() => setIsStartProductionModalOpen(true)}
          />
        </div>

        <div className="flex gap-4 items-center Heading-3 pb-1 pr-10 border-b border-[#eeeeee]">
          <button
            className={`${
              activeTab === "quotation"
                ? "text-primary underline decoration-primary decoration-2 underline-offset-8"
                : "text-gr"
            } cursor-pointer`}
            onClick={activateQuotationTab}
          >
            견적요청서
          </button>
          <div
            className={`${
              activeTab === "history"
                ? "text-primary underline decoration-primary decoration-2 underline-offset-8"
                : "text-gr"
            }`}
          >
            히스토리
          </div>
        </div>

        <div className="flex flex-1 overflow-y-hidden">
          <div
            className={`         
              ${isRightPanelExpanded ? "hidden" : "w-1/2 min-w-[50%]"}
              overflow-hidden border-r border-[#eeeeee] py-8 pr-10
            `}
          >
            {selectedProduct ? (
              <History selectedProduct={selectedProduct} />
            ) : (
              <PreviewImage />
            )}
          </div>

          <div
            className={`         
              ${isRightPanelExpanded ? "w-full" : "w-1/2"} overflow-y-auto
            `}
          >
            <div
              className={`flex flex-col flex-1 py-8 gap-11 pr-10
              ${isRightPanelExpanded ? "pl-0" : "pl-10"}`}
            >
              <div className="flex items-center gap-1 pb-3 border-b border-[#eeeeee]">
                <button
                  className="flex items-center justify-center w-10 h-10 cursor-pointer"
                  onClick={() => setIsRightPanelExpanded(!isRightPanelExpanded)}
                >
                  {isRightPanelExpanded ? (
                    <ArrowLineRightIcon size={20} className="text-dg" />
                  ) : (
                    <ArrowLineLeftIcon size={20} className="text-dg" />
                  )}
                </button>
                <h2 className="flex-1 Heading-2">견적서</h2>
              </div>
              <div className="flex flex-col flex-1 gap-5">
                <h3 className="Heading-3">회사 정보</h3>
                <InputSection />
              </div>
            </div>

            <div
              className={`flex flex-col gap-5 pb-8 pr-10 ${
                isRightPanelExpanded ? "pl-0" : "pl-10"
              }`}
            >
              <RequestInfo onProductClick={handleProductClick} />
            </div>
          </div>
        </div>
      </div>

      {/* 출력하기 버튼 */}
      {isPrintOpen && (
        <OverlayView onClose={() => setIsPrintOpen(false)}>
          <PrintView onClose={() => setIsPrintOpen(false)} />
        </OverlayView>
      )}
      {/* 이메일 보내기 버튼 */}
      {isEmailOpen && (
        <OverlayView onClose={() => setIsEmailOpen(false)}>
          <EmailView onClose={() => setIsEmailOpen(false)} />
        </OverlayView>
      )}
      {/* 생산 시작하기 버튼 */}
      {isStartProductionModalOpen && (
        <StartProductionModal
          onClose={() => setIsStartProductionModalOpen(false)}
        />
      )}
    </>
  );
};

export default QuotationPage;
