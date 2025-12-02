'use client';

import MiniBtn from '@/ui/mini-btn';
import { X } from '@phosphor-icons/react/dist/ssr';
import OrderDocumentView from '../../document/order-document-view';
import {
  QuotationProductDetailResponseModel,
  ClientModel,
} from '@/types/data-model';
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import OrderDocumentPDFView from '@/components/pdf/order-document-pdf-view';
import { useSendQuotationEmail } from '@/hooks';
import Spinner from '@/ui/spinner';
import OverlayView from '@/ui/ovelay-view';

interface EmailViewProps {
  onClose?: () => void;
  onEmailSent?: () => void; // 이메일 전송 성공 시 호출되는 콜백
  documentTitle: string;
  clientData: ClientModel;
  dueDate: string;
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
  quotationId: number | null;
  projectStatus: string;
}

const EmailView = ({
  onClose,
  onEmailSent,
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
  supplyAmount,
  quotationId,
  projectStatus,
}: EmailViewProps) => {
  const [isEmailSending, setIsEmailSending] = useState(false);
  // const [isPDFGenerating, setIsPDFGenerating] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);
  const { sendQuotationEmail, isLoading } = useSendQuotationEmail();

  const generatePDFBase64 = async (): Promise<string | null> => {
    if (!pdfRef.current) return null;

    try {
      const canvas = await html2canvas(pdfRef.current, {
        scale: 1,
        useCORS: false,
        allowTaint: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png'); // 캔버스를 PNG 이미지로 변환 // PDF에 이미지를 삽입하기 위한 데이터
      const pdf = new jsPDF('p', 'mm', 'a4'); // PDF 문서 생성
      // p: portrait (세로 방향)
      // mm: 단위를 밀리미터로 설정
      // a4: A4 크기

      const imgWidth = 210; // A4 너비 (mm)
      const pageHeight = 295; // A4 높이 (mm)

      // 32px 여백을 mm로 변환 (1px ≈ 0.264583mm)
      const marginPx = 32;
      const marginMm = marginPx * 0.264583;

      // 여백을 제외한 실제 이미지 너비
      const availableWidth = imgWidth - marginMm * 2;

      // 이미지 높이 계산 (여백을 제외한 너비에 맞춤)
      const imgHeight = (canvas.height * availableWidth) / canvas.width;

      // 아래쪽 여백을 고려한 실제 이미지 높이
      const availableHeight = pageHeight - marginMm * 2;
      let heightLeft = imgHeight;

      // 여백을 적용하여 이미지 삽입 (좌우 여백: marginMm, 위쪽 여백: 0)
      pdf.addImage(
        imgData,
        'PNG',
        marginMm,
        0, // 위쪽 여백 없음
        availableWidth,
        imgHeight
      );
      heightLeft -= availableHeight; // 아래쪽 여백을 고려한 높이만큼 감소

      while (heightLeft >= 0) {
        pdf.addPage();
        // 여백을 적용하여 이미지 삽입 (좌우 여백: marginMm, 위쪽 여백: 0)
        pdf.addImage(
          imgData,
          'PNG',
          marginMm,
          0, // 위쪽 여백 없음
          availableWidth,
          imgHeight
        );
        heightLeft -= availableHeight; // 아래쪽 여백을 고려한 높이만큼 감소
      }

      // data URI -> base64 string
      const dataUri = pdf.output('datauristring');
      const base64 = dataUri.split(',')[1] || '';
      return base64;
    } catch (error) {
      alert('PDF 생성 중 오류가 발생했습니다.' + error);
      return null;
    }
  };

  // PDF 미리보기 함수
  // const handlePreviewPDF = async () => {
  //   if (!pdfRef.current || isPDFGenerating) return;

  //   setIsPDFGenerating(true);
  //   try {
  //     const canvas = await html2canvas(pdfRef.current, {
  //       scale: 2,
  //       useCORS: false,
  //       allowTaint: false,
  //       backgroundColor: '#ffffff',
  //       logging: false,
  //     });

  //     const imgData = canvas.toDataURL('image/png');
  //     const pdf = new jsPDF('p', 'mm', 'a4');

  //     const imgWidth = 210; // A4 너비 (mm)
  //     const pageHeight = 295; // A4 높이 (mm)
  //     const marginPx = 32;
  //     const marginMm = marginPx * 0.264583;
  //     const availableWidth = imgWidth - marginMm * 2;
  //     const imgHeight = (canvas.height * availableWidth) / canvas.width;
  //     const availableHeight = pageHeight - marginMm * 2;
  //     let heightLeft = imgHeight;

  //     // 첫 번째 페이지
  //     pdf.addImage(imgData, 'PNG', marginMm, 0, availableWidth, imgHeight);
  //     heightLeft -= availableHeight;

  //     // 추가 페이지가 필요한 경우
  //     while (heightLeft >= 0) {
  //       pdf.addPage();
  //       pdf.addImage(imgData, 'PNG', marginMm, 0, availableWidth, imgHeight);
  //       heightLeft -= availableHeight;
  //     }

  //     // PDF를 새 탭에서 열기
  //     const pdfBlob = pdf.output('blob');
  //     const pdfUrl = URL.createObjectURL(pdfBlob);
  //     window.open(pdfUrl, '_blank');

  //     // 메모리 정리
  //     setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  //   } catch (error) {
  //     alert('PDF 미리보기 중 오류가 발생했습니다: ' + error);
  //   } finally {
  //     setIsPDFGenerating(false);
  //   }
  // };

  const handleSendEmail = async () => {
    if (isLoading || !quotationId) return;

    if (!clientData?.email) {
      alert(
        '거래처 이메일이 입력되지 않았습니다. 거래처 정보에서 이메일을 확인해 주세요.'
      );
      return;
    }

    setIsEmailSending(true);
    const base64Pdf = await generatePDFBase64();
    if (!base64Pdf) {
      setIsEmailSending(false);
      return;
    }

    try {
      await sendQuotationEmail({
        email: clientData.email,
        client_name: clientData.name,
        is_confirmed: projectStatus === 'confirmed',
        pdf_data: base64Pdf,
      });
      setIsEmailSending(false); // 성공 시 먼저 로딩 오버레이 닫기
      onClose?.(); // 모달 닫기
      onEmailSent?.(); // 토스트 표시를 위한 콜백 호출
    } catch (err) {
      const message =
        err instanceof Error ? err.message : '이메일 전송에 실패했습니다.';
      alert(message);
      setIsEmailSending(false); // 에러 시에도 오버레이 닫기
    }
  };

  return (
    <>
      <div className="w-full flex flex-col gap-6 px-8 pb-8">
        <div className="sticky pt-8 top-0 bg-wh">
          <div className="flex justify-between h-13 border-b border-lg">
            <h3 className="Heading-3">{documentTitle}</h3>
            <button
              className="w-10 h-10 flex justify-center items-center cursor-pointer rounded-[8px] hover:bg-bg transition-colors duration-200 ease-in-out"
              onClick={onClose}
            >
              <X size={20} />
            </button>
          </div>

          <div className="py-6 w-full flex justify-between border-b border-lg mb-6">
            <div>
              <h2 className="Heading-2">
                이메일로 {documentTitle}를 보내시겠어요?
              </h2>
              <div className="mt-2.5 Me_Body-3 text-gr">
                받는 사람과 제목을 확인한 후, 이메일을 전송해 주세요.
              </div>
            </div>
            <div className="flex gap-2">
              {/* PDF 미리보기 버튼 */}
              {/* <button
                onClick={handlePreviewPDF}
                disabled={isPDFGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="Me_Body-2">
                  {isPDFGenerating ? 'PDF 생성 중...' : 'PDF 미리보기'}
                </span>
              </button> */}

              {/* 이메일 전송 버튼 */}
              <MiniBtn
                text={`${documentTitle} 전송하기`}
                textColor="text-wh"
                bgColor="bg-primary"
                hoverColor="hover:bg-primary-hover"
                onClick={handleSendEmail}
                disabled={isLoading || isEmailSending}
              />
            </div>
          </div>

          {/* 화면 표시용 */}
          <OrderDocumentView
            documentTitle={documentTitle}
            clientData={clientData}
            dueDate={dueDate}
            productListInfoTitle={productListInfoTitle}
            productItems={productItems}
            supplyAmount={supplyAmount}
          />
        </div>

        {/* PDF 생성을 위한 전용 뷰 (화면 밖에 배치) */}
        <div
          ref={pdfRef}
          style={{
            position: 'absolute',
            left: '-9999px',
            top: '-9999px',
            width: '800px',
            backgroundColor: 'white',
          }}
        >
          <OrderDocumentPDFView
            documentTitle={documentTitle}
            clientData={clientData}
            dueDate={dueDate}
            productListInfoTitle={productListInfoTitle}
            productItems={productItems}
            supplyAmount={supplyAmount}
          />
        </div>
      </div>

      {isEmailSending && (
        <OverlayView
          onClose={() => setIsEmailSending(false)}
          bgColor=""
          pageColor="bg-black/30"
          blockExit={true}
        >
          <div className="flex items-center justify-center min-h-[85vh]">
            <Spinner />
          </div>
        </OverlayView>
      )}
    </>
  );
};

export default EmailView;
