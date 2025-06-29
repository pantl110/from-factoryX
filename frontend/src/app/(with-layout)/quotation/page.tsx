"use client";

import { useState, useMemo } from "react";
import {
  ArrowLineLeftIcon,
  ArrowLineRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import RequestInfo from "./request-info";
import InputSection from "./input-section";
import PreviewImage from "./image-preview";
import History from "./history";
import EmailView from "./modals/email-view";
import OverlayView from "@/ui/ovelay-view";
import PrintView from "./modals/print-view";
import { ProductModel } from "./types";
import StartProductionModal from "./modals/start-production-modal";
import ProductEnrollmentModal from "./modals/product-enrollment-modal";
import { useForm } from "@/hooks/use-form";
import { ClientDataModel } from "@/types/data-model";
import { useSearchParams } from "next/navigation";
import TabArea from "./tab-area";
import TitleSec from "./title-sec";

const QuotationPage = () => {
  // 탭 상태
  const [activeTab, setActiveTab] = useState<"quotation" | "history">(
    "quotation",
  );
  // 오른쪽 패널 확장 상태
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false);
  // 선택된 품목 상태 -> 히스토리 보여주기
  const [selectedProduct, setSelectedProduct] = useState<ProductModel | null>(
    null,
  );
  // 모달 상태
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isStartProductionModalOpen, setIsStartProductionModalOpen] =
    useState(false);
  const [isProductEnrollmentModalOpen, setIsProductEnrollmentModalOpen] =
    useState(false);

  // URL 파라미터에서 clientData 가져오기
  const searchParams = useSearchParams();
  const clientDataParam = searchParams.get("clientData");

  // 초기 데이터 설정
  const initialData = useMemo((): ClientDataModel => {
    if (clientDataParam) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(clientDataParam));

        return {
          id: parsedData.id || 0,
          type: parsedData.type || "발주처",
          companyName: parsedData.companyName || "",
          businessNumber: String(parsedData.businessNumber || ""),
          representativeName: parsedData.representativeName || "",
          dueDate: parsedData.dueDate || "",
          email: parsedData.email || "",
          companyAddress: parsedData.companyAddress || "",
          deliveryAddress: parsedData.deliveryAddress || "",
          contact: String(parsedData.contact || ""),
          fax: String(parsedData.fax || ""),
        };
      } catch (error) {
        // console.error("Failed to parse clientData:", error);
      }
    }

    // 기본값
    return {
      id: 0,
      type: "발주처",
      companyName: "",
      businessNumber: "",
      representativeName: "",
      dueDate: "",
      email: "",
      companyAddress: "",
      deliveryAddress: "",
      contact: "",
      fax: "",
    };
  }, [clientDataParam]);

  // 견적서 입력 유효성 검사
  const validationRules = {
    companyName: (v: string) => !!v,
    businessNumber: (v: string) => !!v,
    representativeName: (v: string) => !!v,
    dueDate: (v: string) => !!v,
    companyAddress: (v: string) => !!v,
    email: (v: string) => !!v,
  };
  const form = useForm<ClientDataModel>({ initialData, validationRules });

  const handleProductClick = (product: ProductModel) => {
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
        <TitleSec
          form={form}
          setIsEmailOpen={setIsEmailOpen}
          setIsPrintOpen={setIsPrintOpen}
          setIsStartProductionModalOpen={setIsStartProductionModalOpen}
        />
        <TabArea
          activeTab={activeTab}
          activateQuotationTab={activateQuotationTab}
        />

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
              ${isRightPanelExpanded ? "w-full" : "w-1/2"}`}
          >
            <div
              className={`flex flex-col flex-1 py-8 gap-11 pr-10
              ${isRightPanelExpanded ? "pl-0" : "pl-10"}`}
            >
              <div className="flex items-center gap-2 pb-3 border-b border-[#eeeeee]">
                <button
                  className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-bg transition-colors rounded-lg duration-200"
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
            </div>

            <div className="overflow-y-auto scrollbar-hide h-full">
              <div className="flex flex-col flex-1 gap-5 px-10 pb-11">
                <h3 className="Heading-3">거래처 정보</h3>
                <InputSection form={form} isShowErrors={form.isShowErrors} />
              </div>

              <div
                className={`flex flex-col gap-5 pb-8 pr-10 ${
                  isRightPanelExpanded ? "pl-0" : "pl-10"
                }`}
              >
                <RequestInfo
                  onProductClick={handleProductClick}
                  setIsProductEnrollmentModalOpen={
                    setIsProductEnrollmentModalOpen
                  }
                />
              </div>
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

      {/* 품목 등록 모달 */}
      {isProductEnrollmentModalOpen && (
        <ProductEnrollmentModal
          onClose={() => setIsProductEnrollmentModalOpen(false)}
        />
      )}
    </>
  );
};

export default QuotationPage;
