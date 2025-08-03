'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLineLeftIcon,
  ArrowLineRightIcon,
} from '@phosphor-icons/react/dist/ssr';
import RequestInfo from './request-info';
import PreviewImage from './image-preview';
import History from './history';
import EmailView from './modals/email-view';
import OverlayView from '@/ui/ovelay-view';
import PrintView from './modals/print-view';
import StartProductionModal from './modals/start-production-modal';
import {
  ClientModel,
  OcrDataModel,
  QuotationProductDetailResponseModel,
} from '@/types/data-model';
import useSaveDraftQuotation from '@/hooks/document/quotation/use-save-draft-quotation';
import useStartProduction from '@/hooks/document/quotation/use-start-production';
import { useSearchParams } from 'next/navigation';

// Extend ClientModel for quotation form to include due_date
interface QuotationFormModel extends ClientModel {
  due_date: string;
}
import TabArea from './tab-area';
import { useForm } from 'react-hook-form';
import TitleSec from './title-sec';
import InputSection from './input-section';

const QuotationPageContent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get('quotation_id')
    ? parseInt(searchParams.get('quotation_id') || '0')
    : undefined;
  const projectId = searchParams.get('project_id')
    ? parseInt(searchParams.get('project_id') || '0')
    : undefined;

  const { saveDraft } = useSaveDraftQuotation();
  const { startProduction } = useStartProduction();

  // 거래처 정보 폼
  const { setValue, control, trigger, watch, formState } =
    useForm<QuotationFormModel>({
      defaultValues: {
        factory_id: 0,
        name: '',
        business_registration_number: '',
        representative_name: '',
        business_type: '',
        business_category: '',
        phone: '',
        fax: '',
        email: '',
        address: '',
        manager: '',
        note: '',
        due_date: '',
      },
    });

  // 견적서 & 주문서 상태 관리
  const [isOrderStatus, setIsOrderStatus] = useState(false);
  // 견적 요청 & 중단 상태 관리
  const [isInterruptionStatus, setIsInterruptionStatus] = useState(false);
  // OCR 데이터 상태 관리
  const [ocrData, _setOcrData] = useState<OcrDataModel | null>(null);

  // 탭 상태 - ocr데이터가 없으면 히스토리 탭이 활성화
  const [activeTab, setActiveTab] = useState<'quotation' | 'history'>(
    ocrData ? 'quotation' : 'history'
  );
  // 오른쪽 패널 확장 상태
  const [isRightPanelExpanded, setIsRightPanelExpanded] = useState(false);

  // 선택된 품목 상태 -> 히스토리 보여주기
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  // 모달 상태
  const [isEmailOpen, setIsEmailOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [isStartProductionModalOpen, setIsStartProductionModalOpen] =
    useState(false);

  // 요청 사항 목록에 따라 버튼 활성화 여부
  const [hasQuotationProducts, setHasQuotationProducts] = useState(false);
  // RequestInfo에서 받은 products 데이터
  const [quotationProducts, setQuotationProducts] = useState<
    QuotationProductDetailResponseModel[]
  >([]);

  const handleProductClick = useCallback(
    (productId: number) => {
      setSelectedProduct(productId);
      setActiveTab('history'); // 품목 클릭 시 히스토리탭 활성화
      setIsRightPanelExpanded(false); // 히스토리탭 활성화 시 오른쪽 패널 다시 축소
    },
    [setIsRightPanelExpanded]
  );

  const activateQuotationTab = useCallback(() => {
    setSelectedProduct(null);
    setActiveTab('quotation'); // 견적요청서탭 활성화
    setIsRightPanelExpanded(false); // 견적요청서탭 활성화 시 오른쪽 패널 다시 축소
  }, [setIsRightPanelExpanded]);

  // 패널 토글 함수
  const toggleRightPanel = () => {
    setIsRightPanelExpanded((prev) => !prev);
  };

  // 임시 저장 버튼 핸들러
  const handleSaveDraft = useCallback(async () => {
    try {
      const formData = watch();

      const draftData = {
        quotation_id: quotationId || 0,
        client: {
          factory_id: formData.factory_id,
          name: formData.name,
          business_registration_number: formData.business_registration_number,
          representative_name: formData.representative_name,
          email: formData.email,
          phone: formData.phone,
          fax: formData.fax,
          business_type: formData.business_type,
          business_category: formData.business_category,
          address: formData.address,
          manager: formData.manager,
          note: formData.note,
        },
        due_date: formData.due_date,
        products: quotationProducts
          .filter(
            (product) =>
              product.product_id && product.quantity && product.unit_price
          )
          .map((product) => ({
            product_id: product.product_id as number,
            quantity: product.quantity as number,
            unit_price: product.unit_price as number,
            is_delivery: false,
            delivery_date: null,
          })),
      };

      await saveDraft(draftData);
      // 성공 시 토스트 메시지나 다른 피드백 제공
    } catch {
      throw new Error('Failed to save draft');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveDraft, watch, quotationId, quotationProducts]);

  // 생산 시작 버튼 핸들러
  const handleStartProduction = useCallback(async () => {
    try {
      const formData = watch();
      const productionData = {
        quotation_id: quotationId || 0,
        client: {
          factory_id: formData.factory_id,
          name: formData.name,
          business_registration_number: formData.business_registration_number,
          representative_name: formData.representative_name,
          email: formData.email,
          phone: formData.phone,
          fax: formData.fax,
          business_type: formData.business_type,
          business_category: formData.business_category,
          address: formData.address,
          manager: formData.manager,
          note: formData.note,
        },
        due_date: formData.due_date,
        products: quotationProducts
          .filter(
            (product) =>
              product.product_id && product.quantity && product.unit_price
          )
          .map((product) => ({
            product_id: product.product_id as number,
            quantity: product.quantity as number,
            unit_price: product.unit_price as number,
          })),
      };

      const result = await startProduction(productionData);
      // 성공 시 모달 닫고
      setIsStartProductionModalOpen(false);
      //프로젝트 페이지로 이동
      if (result && result.project_id) {
        router.push(`/production/${result.project_id}`);
      }
    } catch {
      throw new Error('Failed to start production');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startProduction, watch, quotationId]);

  return (
    <>
      <div className="pt-7 pl-10 h-[calc(100vh-61px)] flex flex-col">
        <TitleSec
          setIsEmailOpen={setIsEmailOpen}
          setIsPrintOpen={setIsPrintOpen}
          setIsStartProductionModalOpen={setIsStartProductionModalOpen}
          trigger={trigger}
          watch={watch}
          formState={formState}
          isOrderStatus={isOrderStatus}
          setIsOrderStatus={setIsOrderStatus}
          hasQuotationProducts={hasQuotationProducts}
          onSaveDraft={handleSaveDraft}
          isDirty={formState.isDirty}
          isInterruptionStatus={isInterruptionStatus}
          setIsInterruptionStatus={setIsInterruptionStatus}
          projectId={projectId}
        />
        <TabArea
          isOrderStatus={isOrderStatus}
          activeTab={activeTab}
          activateQuotationTab={activateQuotationTab}
          ocrData={ocrData}
        />

        {/* 왼쪽 사진미리보기/히스토리 부분 */}
        <div className="flex flex-1 overflow-y-hidden">
          <div
            className={`
                ${isRightPanelExpanded ? 'hidden' : 'w-1/2 min-w-[50%]'}
                overflow-hidden border-r border-lg py-8 pr-10
              `}
          >
            {selectedProduct ? (
              <History selectedProduct={selectedProduct} />
            ) : ocrData ? (
              <PreviewImage isOrderStatus={isOrderStatus} />
            ) : (
              <History selectedProduct={null} />
            )}
          </div>

          {/* 오른쪽 견적서 부분 */}
          <div
            className={`
                ${isRightPanelExpanded ? 'w-full' : 'w-1/2'}`}
          >
            <div
              className={`flex flex-col flex-1 pt-8 gap-11 pr-10
                ${isRightPanelExpanded ? 'pl-0' : 'pl-10'}`}
            >
              <div className="flex items-center gap-2 pb-3 border-b border-lg">
                <button
                  className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-bg transition-colors rounded-lg duration-200"
                  onClick={toggleRightPanel}
                >
                  {isRightPanelExpanded ? (
                    <ArrowLineRightIcon size={20} className="text-dg" />
                  ) : (
                    <ArrowLineLeftIcon size={20} className="text-dg" />
                  )}
                </button>
                <h2 className="flex-1 Heading-2">
                  {isOrderStatus ? '주문서' : '견적서'}
                </h2>
              </div>
            </div>

            <div className="overflow-y-auto scrollbar-hide h-full pt-8">
              <div
                className={`flex flex-col flex-1 gap-5 pr-10 pb-11 ${
                  isRightPanelExpanded ? 'pl-0' : 'pl-10'
                }`}
              >
                <h3 className="Heading-3">거래처 정보</h3>
                <InputSection
                  control={control}
                  setValue={setValue}
                  errors={formState.errors}
                />
              </div>

              <div
                className={`flex flex-col gap-5 pb-8 pr-10 ${
                  isRightPanelExpanded ? 'pl-0' : 'pl-10'
                }`}
              >
                <RequestInfo
                  onProductClick={handleProductClick}
                  setHasQuotationProducts={setHasQuotationProducts}
                  onProductsChange={setQuotationProducts}
                  quotationId={quotationId}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 출력하기 버튼 */}
      {isPrintOpen && (
        <OverlayView onClose={() => setIsPrintOpen(false)}>
          <PrintView
            documentTitle={isOrderStatus ? '주문서' : '견적서'}
            clientData={{
              factory_id: watch().factory_id,
              name: watch().name,
              business_registration_number:
                watch().business_registration_number,
              representative_name: watch().representative_name,
              email: watch().email,
              phone: watch().phone,
              fax: watch().fax,
              business_type: watch().business_type,
              business_category: watch().business_category,
              address: watch().address,
              manager: watch().manager,
              note: watch().note,
            }}
            dueDate={watch().due_date}
            productListInfoTitle={
              isOrderStatus ? '주문 품목 정보' : '견적 품목 정보'
            }
            productItems={quotationProducts}
            supplyAmount={quotationProducts.reduce((total, product) => {
              if (product.quantity && product.unit_price) {
                return total + product.quantity * product.unit_price;
              }
              return total;
            }, 0)}
            onClose={() => setIsPrintOpen(false)}
          />
        </OverlayView>
      )}
      {/* 이메일 보내기 버튼 */}
      {isEmailOpen && (
        <OverlayView onClose={() => setIsEmailOpen(false)}>
          <EmailView
            documentTitle={isOrderStatus ? '주문서' : '견적서'}
            clientData={{
              factory_id: watch().factory_id,
              name: watch().name,
              business_registration_number:
                watch().business_registration_number,
              representative_name: watch().representative_name,
              email: watch().email,
              phone: watch().phone,
              fax: watch().fax,
              business_type: watch().business_type,
              business_category: watch().business_category,
              address: watch().address,
              manager: watch().manager,
              note: watch().note,
            }}
            dueDate={watch().due_date}
            productListInfoTitle={
              isOrderStatus ? '주문 품목 정보' : '견적 품목 정보'
            }
            productItems={quotationProducts}
            supplyAmount={quotationProducts.reduce((total, product) => {
              if (product.quantity && product.unit_price) {
                return total + product.quantity * product.unit_price;
              }
              return total;
            }, 0)}
            onClose={() => setIsEmailOpen(false)}
          />
        </OverlayView>
      )}
      {/* 생산 시작하기 버튼 */}
      {isStartProductionModalOpen && (
        <StartProductionModal
          onClose={() => setIsStartProductionModalOpen(false)}
          onClick={handleStartProduction}
        />
      )}
    </>
  );
};

export default QuotationPageContent;
