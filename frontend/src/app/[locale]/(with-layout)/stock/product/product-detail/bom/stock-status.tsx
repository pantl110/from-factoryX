import StockStatusItem from './stock-status-item';
import {
  MaterialProductConnectionModel,
  ProductMaterialConnectionModel,
} from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { useTranslations } from 'next-intl';

type ConnectionModelType =
  | MaterialProductConnectionModel
  | ProductMaterialConnectionModel;

interface StockStatusProps {
  setMaterialId: (id: number | null) => void;
  isLoading?: boolean;
  connections: ConnectionModelType[];
  quantityOverrides?: Record<number, number>;
  setIsQuantityDirty: (isDirty: boolean) => void;
  handleQuantityChange: (connectionId: number, newQuantity: number) => void;
  onDeleteConnection?: (connectionId: number) => void;
  onInvalidQuantity: (message: string, subtext?: string) => void;
  isStagedMode?: boolean;
  onStagedQuantityChange?: (materialId: number, qty: number) => void;
  onOpenSubstituteMaterialsModal: (materialId: number) => void;
  onMaterialModalOpen: () => void;
}

const StockStatus = ({
  isLoading,
  onMaterialModalOpen,
  setMaterialId,
  connections,
  quantityOverrides,
  setIsQuantityDirty,
  handleQuantityChange,
  onDeleteConnection,
  onInvalidQuantity,
  isStagedMode,
  onStagedQuantityChange,
  onOpenSubstituteMaterialsModal,
}: StockStatusProps) => {
  const t = useTranslations('stock.product.bom');
  const tStock = useTranslations('stock');
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  return (
    <>
      {isLoading ? (
        <div className="h-50" />
      ) : connections &&
        Array.isArray(connections) &&
        connections.length > 0 ? (
        <div>
          <div className="flex items-center h-12 border-t border-b border-lg Me_Body-3 cursor-default">
            <p className="flex-1 px-3 text-sv">{tCommon('materialName')}</p>
            <p className="flex-[0.8] px-3 text-sv">
              {tCommon('specification')}
            </p>
            <p className="flex-[0.8] px-3 text-sv">
              {t('tableHeader.usageQuantity')}
            </p>
            <p className="flex-[0.8] px-3 text-sv">{tCommon('unit')}</p>
            <p className="flex-1 px-3 text-sv">
              {t('tableHeader.substituteMaterials')}
            </p>
            <p className="flex-[0.5] px-3 text-sv">
              {t('tableHeader.stockStatus')}
            </p>
            {!isViewer && hasSubscription() && (
              <p className="w-20 px-3 text-sv">{tCommon('action')}</p>
            )}
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
                  onDeleteConnection={onDeleteConnection || (() => {})}
                  onInvalidQuantity={onInvalidQuantity}
                  isStagedMode={isStagedMode}
                  onStagedQuantityChange={onStagedQuantityChange}
                  onOpenSubstituteMaterialsModal={
                    onOpenSubstituteMaterialsModal
                  }
                />
              );
            }
            return null; // ProductMaterialConnectionModel은 표시하지 않음
          })}
        </div>
      ) : (
        <NoHistoryBox
          title={t('stockStatus.empty.title')}
          text={t('stockStatus.empty.description')}
          button={tStock('connectButton.material')}
          onClick={() => {
            onMaterialModalOpen();
          }}
          disabled={isViewer || !hasSubscription()}
        />
      )}
    </>
  );
};

export default StockStatus;
