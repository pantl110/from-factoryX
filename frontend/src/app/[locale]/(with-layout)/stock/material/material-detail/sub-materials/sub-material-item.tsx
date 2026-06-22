import { useTranslations } from 'next-intl';
import { ArrowLineUpRight, Trash } from '@phosphor-icons/react';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { MaterialSimpleModel } from '@/types/data-model';
import MaterialDetailPanel from '../index';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { IconBtn, RoundChip } from '@/ui';
import { removeTrailingZeros } from '@/utils';

interface SubMaterialItemProps {
  material: MaterialSimpleModel;
  sourceMaterialId: number; // 원본 자재 ID (대체 자재 관계를 다시 불러오기 위해 필요)
  handleOpenDeleteSubstituteModal: (
    sourceMaterialId: number,
    targetMaterialId: number
  ) => void;
}

export const SubMaterialItem = ({
  material,
  sourceMaterialId,
  handleOpenDeleteSubstituteModal,
}: SubMaterialItemProps) => {
  const tCommon = useTranslations('common');
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );
  const queryClient = useQueryClient();

  const [isMaterialDetailPanelOpen, setIsMaterialDetailPanelOpen] =
    useState(false);

  // 백엔드에서 받은 한글 상태를 번역 키로 매핑
  const getStatusTranslationKey = (
    status: string | null | undefined
  ): string | null => {
    if (!status) return null;

    const statusMap: Record<string, string> = {
      과재고: 'inventoryStatus.overstock',
      충분: 'inventoryStatus.sufficient',
      위험: 'inventoryStatus.risk',
      부족: 'inventoryStatus.shortage',
    };

    return statusMap[status] || null;
  };

  // 재고 상태 계산 함수
  const getStockStatus = (): {
    text: string;
    color: 'secondary' | 'red';
  } | null => {
    // 백엔드에서 status를 받은 경우 우선 사용
    if (material.status) {
      const translationKey = getStatusTranslationKey(material.status);
      if (translationKey) {
        const isRedStatus =
          material.status === '위험' || material.status === '부족';
        return {
          text: tCommon(translationKey),
          color: isRedStatus ? ('red' as const) : ('secondary' as const),
        };
      }
    }

    // 백엔드에서 status가 없으면 기존 로직 사용
    const currentStock = material.current_stock ?? 0;
    const standardStock = material.standard_stock;

    // 기준 재고가 없으면(null/undefined) 상태를 반환하지 않음
    if (standardStock === null || standardStock === undefined) {
      return null;
    }

    // 현재 재고가 0이면 위험
    if (currentStock === 0) {
      return {
        text: tCommon('inventoryStatus.risk'),
        color: 'red' as const,
      };
    }

    if (currentStock >= standardStock) {
      return {
        text: tCommon('inventoryStatus.sufficient'),
        color: 'secondary' as const,
      };
    } else {
      return {
        text: tCommon('inventoryStatus.shortage'),
        color: 'red' as const,
      };
    }
  };

  const stockStatus = getStockStatus();
  const stockQuantity =
    material.current_stock !== null && material.current_stock !== undefined
      ? `${removeTrailingZeros(material.current_stock)}${material.unit}`
      : '-';

  return (
    <>
      <div className="flex items-center h-14 border-b border-lg transition-colors duration-200 ease-in-out Me_Body-3 cursor-default">
        <div
          className="flex-1 px-3 flex items-center justify-between gap-1 min-w-0"
          title={material.name}
        >
          <p className="text-dg truncate">{material.name}</p>
          <IconBtn
            icon={ArrowLineUpRight}
            size="w-9 h-9"
            iconSize={16}
            onClick={() => {
              setIsMaterialDetailPanelOpen(true);
            }}
          />
        </div>
        <p className="flex-1 px-3 text-dg">{material.code}</p>
        <p className="flex-1 px-3 text-dg">{material.spec}</p>
        <p className="flex-1 px-3 text-dg">{stockQuantity}</p>

        <div className="flex-[0.5] px-3">
          {stockStatus ? (
            <RoundChip
              text={stockStatus.text}
              variant="sm"
              color={stockStatus.color}
            />
          ) : (
            <span className="text-dg Me_Body-3">-</span>
          )}
        </div>

        {!isViewer && hasSubscription() && (
          <div className="w-20 px-3">
            <IconBtn
              icon={Trash}
              size="w-9 h-9"
              iconSize={16}
              onClick={() => {
                handleOpenDeleteSubstituteModal(sourceMaterialId, material.id);
              }}
              hoverBg={false}
              hoverText={true}
            />
          </div>
        )}
      </div>

      {/* 자재 상세 모달 */}
      {isMaterialDetailPanelOpen && (
        <MaterialDetailPanel
          setIsMaterialDetailOpen={setIsMaterialDetailPanelOpen}
          selectedMaterialId={material.id}
          onSuccess={() => {
            // 자재 정보가 업데이트되었으므로 대체 자재 관계 목록을 다시 불러옴
            queryClient.invalidateQueries({
              queryKey: ['substitute', 'by-material', sourceMaterialId],
            });
          }}
        />
      )}
    </>
  );
};
