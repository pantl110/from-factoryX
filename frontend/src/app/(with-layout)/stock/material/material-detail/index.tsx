import MiniBtn from '@/ui/mini-btn';
import MaterialInfo from './material-info';
import ProductRequiringMaterial from './product-requiring-material';
import QuotationHistory from './quotation-history.tsx';
import MaterialStockLog from './material-stock-log';
import StockLocation from '../../stock-location';
import NoHistoryBox from '@/ui/no-history-box';

interface MaterialDetailProps {
  setIsCustomerInfoModalOpen: (v: boolean) => void;
  setIsProductEnrollmentModalOpen: (v: boolean) => void;
  stockLocationCount: number;
  handleAddStockLocation: () => void;
  handleDeleteStockLocation: (index: number) => void;
  handleOpenUploadModal: (index: number) => void;
}

const MaterialDetail = ({
  setIsCustomerInfoModalOpen,
  setIsProductEnrollmentModalOpen,
  stockLocationCount,
  handleAddStockLocation,
  handleDeleteStockLocation,
  handleOpenUploadModal,
}: MaterialDetailProps) => {
  return (
    <>
      <div className="flex flex-col gap-10">
        {/* 원자재 정보 */}
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            원자재 정보
          </h3>
          <MaterialInfo />
        </div>

        {/* 원자재가 보관된 창고 위치 */}
        <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 h-10 flex items-center text-dg">
              원자재가 보관된 창고 위치
            </h3>
            <MiniBtn
              text="추가"
              textColor="text-dg"
              borderColor="border-lg"
              hoverColor="hover:bg-bg"
              onClick={handleAddStockLocation}
            />
          </div>
          {stockLocationCount > 0 ? (
            <StockLocation
              itemCount={stockLocationCount}
              onItemDelete={handleDeleteStockLocation}
              onPlusClick={handleOpenUploadModal}
            />
          ) : (
            <NoHistoryBox
              title="등록된 창고 위치가 아직 없어요."
              text="[추가] 버튼을 눌러 원자재가 보관된 창고를 등록해보세요."
            />
          )}
        </div>

        {/* 업체별 단가 비교 */}
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            업체별 견적 내용
          </h3>
          <QuotationHistory
            setIsCustomerInfoModalOpen={setIsCustomerInfoModalOpen}
          />
        </div>

        {/* 원자재가 연결된 품목 */}
        <div className="flex flex-col gap-3">
          <div className="h-10 flex items-center justify-between">
            <h3 className="Heading-3 text-dg">원자재가 연결된 품목</h3>
            <MiniBtn
              text="품목 연결"
              textColor="text-dg"
              borderColor="border-lg"
              hoverColor="hover:bg-bg"
              onClick={() => setIsProductEnrollmentModalOpen(true)}
            />
          </div>
          <ProductRequiringMaterial />
        </div>

        {/* 원자재 입·출고 내역 */}
        <div className="flex flex-col gap-3">
          <h3 className="Heading-3 text-dg h-10 flex items-center">
            원자재 입·출고 내역
          </h3>
          <MaterialStockLog />
        </div>
      </div>
    </>
  );
};

export default MaterialDetail;
