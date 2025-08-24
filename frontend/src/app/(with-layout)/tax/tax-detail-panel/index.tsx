import {
  PublishedTaxInvoiceResponseModel,
  TaxClientInfoModel,
  TaxLineItemModel,
} from '@/types/data-model';
import Panel from '@/ui/panel';
import TaxDocumentView from '@/app/(with-layout)/document/tax-document-view';
import MiniBtn from '@/ui/mini-btn';
import { useGetTaxInvoiceDetail, useToast } from '@/hooks';
import { useState, useEffect } from 'react';
import Spinner from '@/ui/spinner';
import Toast from '@/ui/toast';
import { CheckCircle } from '@phosphor-icons/react';
import LinkTaxModal from '../../project/process/modals/link-tax-modal/link-tax-modal';
import CreateTaxPanel from '../list/create-tax-panel';
import { TaxProductInfoModel } from '@/types/data-model';

// 세금계산서 편집용 품목 데이터 타입
interface TaxProductEditModel {
  productId: number;
  quantity: number;
  unit_price: number;
  products_info: TaxProductInfoModel[];
}

interface TaxDetailPanelProps {
  itemId: number;
  onClose: () => void;
  canLink?: boolean;
}

const TaxDetailPanel = ({ itemId, onClose, canLink }: TaxDetailPanelProps) => {
  const [item, setItem] = useState<PublishedTaxInvoiceResponseModel | null>(
    null
  );
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedLineItem, setSelectedLineItem] =
    useState<TaxLineItemModel | null>(null); // 선택한 item을 material history에 연결할 때 사용
  const [isEditingMode, setIsEditingMode] = useState(false);

  const { getTaxInvoiceDetail, isLoading } = useGetTaxInvoiceDetail();
  const { isToastOpen, isVisible, showToast } = useToast();

  // 처음 마운트 시에만 데이터 가져오기 & 편집 모드 설정
  useEffect(() => {
    const fetchData = async () => {
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
  if (isLoading || !item) {
    return null;
  }

  const isDraft = item.barobill_state === '임시저장';

  return (
    <>
      {isEditingMode ? (
        <CreateTaxPanel
          onClose={onClose}
          tax_id={item.id || undefined}
          initialClientData={item.client_info as TaxClientInfoModel}
          initialProducts={
            item.products_info?.map((product, index) => ({
              productId: product.id,
              quantity: Number(item.line_items?.[index]?.chargeable_unit) || 0,
              unit_price: Number(item.line_items?.[index]?.unit_price) || 0,
              products_info: item.products_info, // 모든 품목 상세 정보 포함
            })) as TaxProductEditModel[]
          }
          setIsEditingMode={setIsEditingMode}
        />
      ) : (
        <Panel
          title={`${item?.tax_invoice_type === 'sales' ? '매출' : '매입'} 세금계산서`}
          onClose={onClose}
          headerButton={
            item &&
            isDraft &&
            ((handleClose) => (
              <div className="flex gap-2 relative">
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
                    handleClose();
                    // 판넬이 닫힌 후 토스트 나오기 위해 250ms 딜레이
                    setTimeout(() => {
                      showToast();
                    }, 250);
                  }}
                />
              </div>
            ))
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

      {canLink && isLinkModalOpen && (
        <LinkTaxModal
          onClose={() => setIsLinkModalOpen(false)}
          linkedItemId={itemId} // 세금계산서 아이디
          type="tax"
          selectedLineItem={selectedLineItem || undefined}
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
