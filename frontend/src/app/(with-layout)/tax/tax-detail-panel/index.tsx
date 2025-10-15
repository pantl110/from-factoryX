import {
  PublishedTaxInvoiceResponseModel,
  TaxClientInfoModel,
  TaxLineItemModel,
} from '@/types/data-model';
import Panel from '@/ui/panel';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';
import MiniBtn from '@/ui/mini-btn';
import { useGetTaxInvoiceDetail, useToast, useCancelTaxInvoice } from '@/hooks';
import { useState, useEffect } from 'react';
import Toast from '@/ui/toast';
import { CheckCircle } from '@phosphor-icons/react';
import LinkTaxModal from '../../project/process/modals/link-tax-modal/link-tax-modal';
import CreateTaxPanel from '../list/create-tax-panel';
import PublishTaxModal from './publish-tax-modal';

// 세금계산서 편집용 제품 데이터 타입
interface TaxProductEditModel {
  productId: number;
  quantity: number;
  unit_price: number;
  product_name: string;
  product_code: string;
  product_spec: string;
}

interface TaxDetailPanelProps {
  itemId?: number;
  onClose: () => void;
  canLink?: boolean;
  projectId?: number;
  initialClientData?: TaxClientInfoModel;
  initialProducts?: TaxProductEditModel[];
}

const TaxDetailPanel = ({
  itemId,
  onClose,
  canLink = false,
  projectId,
  initialClientData,
  initialProducts,
}: TaxDetailPanelProps) => {
  // 모달
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  // 정보
  const [item, setItem] = useState<PublishedTaxInvoiceResponseModel | null>(
    null
  );
  const [selectedLineItem, setSelectedLineItem] =
    useState<TaxLineItemModel | null>(null); // 선택한 item을 material history에 연결할 때 사용
  // 생성 판넬/디테일 판넬 구분
  const [isEditingMode, setIsEditingMode] = useState(false);
  // 새로 생성된 세금계산서 ID (임시저장 함수 진행 후 반환된 세금계산서 ID)
  const [createdTaxId, setCreatedTaxId] = useState<number | null>(null);

  const { getTaxInvoiceDetail, isLoading } = useGetTaxInvoiceDetail();
  const { isToastOpen, isVisible, showToast } = useToast();
  const { cancelTaxInvoice, isLoading: isCancelLoading } =
    useCancelTaxInvoice();

  // 처음 마운트 시에만 데이터 가져오기 & 편집 모드 설정
  useEffect(() => {
    const fetchData = async () => {
      if (!itemId) return;
      const result = await getTaxInvoiceDetail(itemId);
      if (result.success && result.data) {
        setItem(result.data);
        // 데이터 로딩 완료 후 편집 모드 설정
        setIsEditingMode(result.data.barobill_state === '임시저장');
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId]);

  // 데이터만 다시 로드 (편집 모드 상태 유지)
  const refetchData = async () => {
    if (!itemId) return;
    const result = await getTaxInvoiceDetail(itemId);
    if (result.success && result.data) {
      setItem(result.data);
      // 여기서는 setIsEditingMode 호출하지 않음
    }
  };

  // isEditingMode가 바뀔 때 데이터 다시 로드
  useEffect(() => {
    if (item) {
      // item이 있을 때만 실행 (초기 로드 후)
      refetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingMode]);

  // 데이터가 로딩 중이거나 없으면 로딩 표시
  // itemId가 없을 때는 item을 기다리지 않음 (새로 생성하는 경우)
  if (itemId && (isLoading || !item)) {
    return null;
  }

  // item이 존재할 때만 isDraft 계산
  const isDraft = item?.barobill_state === '임시저장';
  const isPendingTransmission =
    item?.barobill_state === '발급완료' && item?.nts_send_state === '전송전';

  return (
    <>
      {isEditingMode || !itemId ? (
        <CreateTaxPanel
          onClose={onClose}
          taxId={item?.id || createdTaxId || undefined}
          initialClientData={
            (item?.client_info as TaxClientInfoModel) || initialClientData
          }
          initialProducts={
            (item?.line_items?.map((product, index) => ({
              productId: product.product_id, // lineitem의 product_id 사용
              quantity: Number(item?.line_items?.[index]?.chargeable_unit) || 0,
              unit_price: Number(item?.line_items?.[index]?.unit_price) || 0,
              product_name: product.name,
              product_code: product.code,
              product_spec: product.information,
            })) as TaxProductEditModel[]) || initialProducts
          }
          setIsEditingMode={setIsEditingMode}
          onTaxCreated={setCreatedTaxId} // 새로 생성된 세금계산서 ID 전달
          projectId={projectId}
        />
      ) : (
        <Panel
          title={`${item?.tax_invoice_type === 'sales' ? '매출' : '매입'} 세금계산서`}
          onClose={onClose}
          headerButton={
            <>
              {item && isDraft && (
                <div className="flex gap-2">
                  <MiniBtn
                    text="수정"
                    textColor="text-dg"
                    borderColor="border-lg"
                    hoverColor="hover:bg-bg"
                    onClick={() => {
                      setIsEditingMode(true);
                    }}
                  />
                  <MiniBtn
                    text="발행"
                    textColor="text-wh"
                    bgColor="bg-primary"
                    hoverColor="hover:bg-primary-hover"
                    onClick={() => {
                      setIsPublishModalOpen(true);
                    }}
                  />
                </div>
              )}

              {/* 전송 대기 시 취소 가능 */}
              {isPendingTransmission && (
                <MiniBtn
                  text="발행 취소"
                  textColor="text-red"
                  bgColor="bg-red-8"
                  hoverColor="hover:bg-red-hover"
                  onClick={async () => {
                    if (itemId) {
                      const result = await cancelTaxInvoice(itemId);
                      if (result.success) {
                        onClose();
                      }
                    }
                  }}
                  disabled={isCancelLoading}
                />
              )}
            </>
          }
        >
          <TaxDocumentView
            item={item}
            canLink={canLink}
            setIsLinkModalOpen={setIsLinkModalOpen}
            setSelectedLineItem={setSelectedLineItem}
          />
        </Panel>
      )}

      {/* 세금계산서 발행 모달 */}
      {isPublishModalOpen && (
        <PublishTaxModal
          taxId={itemId || createdTaxId || 0}
          onClose={() => setIsPublishModalOpen(false)}
          onSuccess={() => {
            // 발행 성공 후 모달과 판넬을 닫고 토스트 표시
            setIsPublishModalOpen(false); // 모달 닫기
            onClose(); // 판넬 닫기
            // 판넬이 닫힌 후 토스트 나오기 위해 250ms 딜레이
            setTimeout(() => {
              showToast();
            }, 250);
          }}
        />
      )}

      {canLink && isLinkModalOpen && itemId && (
        <LinkTaxModal
          onClose={() => setIsLinkModalOpen(false)}
          linkedItemId={itemId} // 세금계산서 아이디
          type="tax"
          clientId={item?.client} // client 필드 사용
          selectedLineItem={selectedLineItem || undefined}
          onSuccess={() => {
            // 선택된 lineItem의 material_history 필드만 업데이트
            if (selectedLineItem && item) {
              const updatedLineItems = item.line_items.map((lineItem) =>
                lineItem.id === selectedLineItem.id
                  ? { ...lineItem, material_history: 1 } // 연결됨 표시 위해 임시로 1로 설정
                  : lineItem
              );
              setItem({ ...item, line_items: updatedLineItems });
            }
          }}
        />
      )}

      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={20} className="text-primary" />}
          text="세금계산서 발행이 완료되었어요."
          subtext="세금계산서는 발행일 기준으로 처리돼요."
          type="primary"
          isVisible={isVisible}
        />
      )}
    </>
  );
};

export default TaxDetailPanel;
