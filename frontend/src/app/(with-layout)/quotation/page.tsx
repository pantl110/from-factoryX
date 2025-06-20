"use client";

import { useState } from "react";
import Chip from "@/ui/chip";
import { ArrowLineLeftIcon } from "@phosphor-icons/react/dist/ssr";
import RequestInfo from "./request-info";
import ButtonSection from "./button-section";
import InputSection from "./input-section";
import PreviewImage from "./image-preview";
import History from "./history";
import EmailView from "./email-view";
import OverlayView from "@/ui/ovelay-view";
import PrintView from "./print-view";
import { ProductType } from "./types";

const QuotationPage = () => {
  const [activeTab, setActiveTab] = useState<"quotation" | "history">(
    "quotation",
  );
  const [selectedProduct, setSelectedProduct] = useState<ProductType | null>(
    null,
  );
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  const handleProductClick = (product: ProductType) => {
    setSelectedProduct(product);
    setActiveTab("history"); // 품목 클릭 시 히스토리탭이 활성화
  };

  const handleBackToPreview = () => {
    setSelectedProduct(null);
    setActiveTab("quotation"); // 견적요청서탭 활성화
  };

  return (
    <>
      <div className="pt-7 px-10 h-[calc(100vh-61px)] flex flex-col">
        <div className="flex gap-1 mb-4">
          <div className="flex-1 gap-1">
            <Chip
              text="견적 협의중"
              containerWidth="w-[150px]"
              bgColor="bg-primary-8"
              textColor="text-primary"
            />
            <h1 className="Heading-1 mt-2">플라스틱이 좋아</h1>
          </div>
          <ButtonSection
            onEmailClick={() => setIsEmailOpen(true)}
            onPrintClick={() => setIsPrintOpen(true)}
          />
        </div>

        <div className="flex gap-4 items-center Heading-3 pb-1 border-b border-[#eeeeee]">
          <button
            className={`${
              activeTab === "quotation"
                ? "text-primary underline decoration-primary decoration-2 underline-offset-8"
                : "text-gr"
            } cursor-pointer`}
            onClick={handleBackToPreview}
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
          <div className="flex-1 border-r border-[#eeeeee] py-8 pr-10">
            {selectedProduct ? (
              <History selectedProduct={selectedProduct} />
            ) : (
              <PreviewImage />
            )}
          </div>

          <div className="flex-1 min-w-0 overflow-y-auto">
            <div className="flex flex-col flex-1 max-w-[900px] py-8 pl-10 gap-11 ">
              <div className="flex items-center gap-1 pb-3 border-b border-[#eeeeee]">
                <div className="flex items-center justify-center w-10 h-10">
                  <ArrowLineLeftIcon size={20} className="text-dg" />
                </div>
                <h2 className="flex-1 Heading-2">견적서</h2>
              </div>
              <div className="flex flex-col flex-1 gap-5">
                <h3 className="Heading-3">회사 정보</h3>
                <InputSection />
              </div>
            </div>
            <RequestInfo onProductClick={handleProductClick} />
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
    </>
  );
};

export default QuotationPage;
