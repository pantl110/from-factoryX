import MiniBtn from '@/ui/mini-btn';
import StockStatus from './stock-status';
import {
  MaterialProductConnectionModel,
  ProductMaterialConnectionModel,
  MaterialProductConnectionResponseModel,
} from '@/types/data-model';
import useMemberStore from '@/store/member-store';
import { useTooltip } from '@/hooks';
import Tooltip from '@/ui/tooltip';
import { Info } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

type ConnectionModelType =
  | MaterialProductConnectionModel
  | ProductMaterialConnectionModel;

interface BOMProps {
  productId?: number | null;
  connections?:
    | ConnectionModelType[]
    | MaterialProductConnectionResponseModel
    | null;
  stagedMaterials: Array<{
    id: number;
    name: string;
    code: string;
    spec: string;
    unit: string;
    quantityUnit?: string;
    quantity: number;
  }>;
  quantityChanges: Record<number, number>;
  hasSubscription: () => boolean;
  onMaterialModalOpen: () => void;
  onMaterialIdChange: (id: number | null) => void;
  onQuantityDirtyChange: (isDirty: boolean) => void;
  onQuantityChange: (materialId: number, quantity: number) => void;
  onInvalidQuantity: (message: string) => void;
  onStagedQuantityChange: (materialId: number, quantity: number) => void;
  onPersistStagedConnections?: (newProductId: number) => Promise<void>;
  onOpenSubstituteMaterialsModal: (materialId: number) => void;
  onDeleteConnection?: (connectionId: number) => void;
  isLoading?: boolean;
}

const Bom = ({
  productId,
  connections,
  stagedMaterials,
  quantityChanges,
  hasSubscription,
  onMaterialModalOpen,
  onMaterialIdChange,
  onQuantityDirtyChange,
  onQuantityChange,
  onInvalidQuantity,
  onStagedQuantityChange,
  onOpenSubstituteMaterialsModal,
  onDeleteConnection,
  isLoading,
}: BOMProps) => {
  const t = useTranslations('stock.product.bom');
  const tStock = useTranslations('stock');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';

  const { onMouseEnter, onMouseLeave, isVisible } = useTooltip({});

  // 데이터 유무 판단: hasData가 "있을 때"를 의미
  const hasData = productId
    ? Boolean(
        connections &&
          Array.isArray(connections) &&
          (connections as ConnectionModelType[]).length > 0
      )
    : stagedMaterials.length > 0;

  // 수량 변경 추적 함수
  const handleQuantityChange = (connectionId: number, newQuantity: number) => {
    onQuantityChange(connectionId, newQuantity);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="Heading-3 h-10 flex items-center text-dg">
            {t('title')}
          </h3>
          <div
            className="relative"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            <Info size={20} className="text-gr cursor-help" />
            {isVisible && (
              <div className="absolute z-10 top-7 -left-2 w-140">
                <Tooltip text={t('tooltip')} color="black" position="left" />
              </div>
            )}
          </div>
        </div>
        {hasData && (
          <MiniBtn
            text={tStock('connectButton.material')}
            variant="outline"
            onClick={onMaterialModalOpen}
            disabled={isViewer || !hasSubscription()}
          />
        )}
      </div>

      <StockStatus
        connections={
          productId
            ? connections && Array.isArray(connections)
              ? (connections as ConnectionModelType[])
              : []
            : (stagedMaterials.map((m, idx) => ({
                connection_id: -(idx + 1),
                material_id: m.id,
                material_name: m.name,
                material_code: m.code,
                material_spec: m.spec,
                material_unit: m.quantityUnit || m.unit,
                quantity: m.quantity,
              })) as unknown as ConnectionModelType[])
        }
        quantityOverrides={quantityChanges}
        setMaterialId={onMaterialIdChange}
        setIsQuantityDirty={onQuantityDirtyChange}
        handleQuantityChange={handleQuantityChange}
        onDeleteConnection={onDeleteConnection}
        onInvalidQuantity={onInvalidQuantity}
        isStagedMode={!productId}
        onStagedQuantityChange={onStagedQuantityChange}
        onOpenSubstituteMaterialsModal={onOpenSubstituteMaterialsModal}
        onMaterialModalOpen={onMaterialModalOpen}
        isLoading={isLoading}
      />
    </div>
  );
};

export default Bom;
