import StockStatusItem from './stock-status-item';
import {
  MaterialProductConnectionModel,
  MaterialResponseModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface StockStatusProps {
  setIsMaterialDetailPanelOpen: (isOpen: boolean) => void;
  setMaterialId: (id: number) => void;
  connections: MaterialProductConnectionModel[];
  materialDetails: Record<number, MaterialResponseModel>;
  setIsQuantityDirty: (isDirty: boolean) => void;
  handleQuantityChange: (connectionId: number, newQuantity: number) => void;
  onDeleteConnection: (connectionId: number) => void;
  onInvalidQuantity: (message: string) => void;
}

const StockStatus = ({
  setIsMaterialDetailPanelOpen,
  setMaterialId,
  connections,
  materialDetails,
  setIsQuantityDirty,
  handleQuantityChange,
  onDeleteConnection,
  onInvalidQuantity,
}: StockStatusProps) => {
  return (
    <>
      {connections && Array.isArray(connections) && connections.length > 0 ? (
        <div>
          <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1">
            <p className="flex-1 px-3 text-sv">자재명</p>
            <p className="flex-1 px-3 text-sv">자재 코드</p>
            <p className="flex-1 px-3 text-sv">규격</p>
            <p className="flex-[0.5] px-3 text-sv">단위</p>
            <p className="flex-[0.5] px-3 text-sv">사용 수량</p>
            <p className="flex-[0.8] px-3 text-sv">자재 재고 상태</p>
            <div className="w-8" />
          </div>

          {connections.map(
            (connection: MaterialProductConnectionModel, index: number) => {
              const materialDetail = materialDetails[connection.material_id];

              return (
                <StockStatusItem
                  key={index}
                  connection={connection}
                  materialDetail={materialDetail}
                  setIsMaterialDetailPanelOpen={setIsMaterialDetailPanelOpen}
                  setMaterialId={setMaterialId}
                  setIsQuantityDirty={setIsQuantityDirty}
                  handleQuantityChange={handleQuantityChange}
                  onDeleteConnection={onDeleteConnection}
                  onInvalidQuantity={onInvalidQuantity}
                />
              );
            }
          )}
        </div>
      ) : (
        <NoHistoryBox
          title="이 품목에 연결된 원자재가 아직 없어요."
          text="원자재를 연결하면 이곳에서 재고 상태를 확인할 수 있어요."
        />
      )}
    </>
  );
};

export default StockStatus;
