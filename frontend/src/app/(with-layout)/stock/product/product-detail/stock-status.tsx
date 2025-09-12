import StockStatusItem from './stock-status-item';
import {
  MaterialProductConnectionModel,
  ProductMaterialConnectionModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

type ConnectionModelType =
  | MaterialProductConnectionModel
  | ProductMaterialConnectionModel;

interface StockStatusProps {
  setMaterialId: (id: number | null) => void;
  connections: ConnectionModelType[];
  quantityOverrides?: Record<number, number>;
  setIsQuantityDirty: (isDirty: boolean) => void;
  handleQuantityChange: (connectionId: number, newQuantity: number) => void;
  onDeleteConnection: (connectionId: number) => void;
  onInvalidQuantity: (message: string, subtext?: string) => void;
  isStagedMode?: boolean;
  onStagedQuantityChange?: (materialId: number, qty: number) => void;
}

const StockStatus = ({
  setMaterialId,
  connections,
  quantityOverrides,
  setIsQuantityDirty,
  handleQuantityChange,
  onDeleteConnection,
  onInvalidQuantity,
  isStagedMode,
  onStagedQuantityChange,
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
            <div className="w-9" />
          </div>

          {connections.map((connection: ConnectionModelType, index: number) => {
            // MaterialProductConnectionModel인지 확인
            if ('material_id' in connection) {
              const overrideQuantity =
                quantityOverrides?.[
                  (connection as MaterialProductConnectionModel).connection_id
                ];

              return (
                <StockStatusItem
                  key={index}
                  connection={connection as MaterialProductConnectionModel}
                  overrideQuantity={overrideQuantity}
                  setMaterialId={setMaterialId}
                  setIsQuantityDirty={setIsQuantityDirty}
                  handleQuantityChange={handleQuantityChange}
                  onDeleteConnection={onDeleteConnection}
                  onInvalidQuantity={onInvalidQuantity}
                  isStagedMode={isStagedMode}
                  onStagedQuantityChange={onStagedQuantityChange}
                />
              );
            }
            return null; // ProductMaterialConnectionModel은 표시하지 않음
          })}
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
