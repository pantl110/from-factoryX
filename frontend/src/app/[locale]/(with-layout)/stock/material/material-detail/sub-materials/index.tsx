import { useTranslations } from 'next-intl';
import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { SubMaterialItem } from './sub-material-item';
import { useSubstitutesByMaterialQuery } from '@/hooks';
import { MaterialSimpleModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Pagination from '@/components/pagination';
import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface SubMaterialsProps {
  materialId: number;
  setIsCreateSubstituteModalOpen: (v: boolean) => void;
  handleOpenDeleteSubstituteModal: (
    sourceMaterialId: number,
    targetMaterialId: number
  ) => void;
}

export interface SubMaterialsRefModel {
  resetToFirstPage: () => void;
}

export const SubMaterials = forwardRef<SubMaterialsRefModel, SubMaterialsProps>(
  (
    {
      materialId,
      setIsCreateSubstituteModalOpen,
      handleOpenDeleteSubstituteModal,
    },
    ref
  ) => {
    const t = useTranslations('stock.material.subMaterials');
    const tCommon = useTranslations('common');
    const role = useMemberStore((state) => state.role);
    const isViewer = role === 'viewer';
    const hasSubscription = useSubscriptionStore(
      (state) => state.hasSubscription
    );

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // 이 자재가 source_material인 대체 자재 관계들 조회
    const {
      data: substituteListResponse,
      isLoading,
      error,
    } = useSubstitutesByMaterialQuery(materialId, true, currentPage, pageSize);

    // 페이지네이션 정보
    const totalPages = substituteListResponse?.pageCnt || 0;

    // data가 이미 페이지네이션된 target_materials 배열
    const targetMaterials: (MaterialSimpleModel & { relation_id?: number })[] =
      substituteListResponse?.data || [];

    // 외부에서 페이지 리셋할 수 있도록 ref 노출
    useImperativeHandle(ref, () => ({
      resetToFirstPage: () => {
        setCurrentPage(1);
      },
    }));

    // 페이지 유효성 관리 (삭제 등으로 비는 경우 포함)
    useEffect(() => {
      const hasData = targetMaterials.length > 0;

      if (totalPages > 0 && currentPage > totalPages) {
        setCurrentPage(totalPages);
        return;
      }

      if (!isLoading && currentPage > 1 && !hasData) {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
      }
    }, [isLoading, currentPage, targetMaterials.length, totalPages]);

    return (
      <div className="flex flex-col gap-3">
        <div className="h-10 flex items-center justify-between">
          <h3 className="Heading-3 text-dg">{t('title')}</h3>
          {targetMaterials.length > 0 && (
            <MiniBtn
              text={t('connectButton')}
              variant="whiteOutline"
              disabled={isViewer || !hasSubscription()}
              onClick={() => {
                setIsCreateSubstituteModalOpen(true);
              }}
            />
          )}
        </div>

        {/* 데이터가 있는 경우 */}
        {isLoading ? (
          <div className="h-50" />
        ) : !error && targetMaterials.length > 0 ? (
          <div className="flex flex-col">
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
              <p className="flex-1 px-3 text-sv">{tCommon('materialName')}</p>
              <p className="flex-1 px-3 text-sv">{tCommon('materialCode')}</p>
              <p className="flex-1 px-3 text-sv">{tCommon('specification')}</p>
              <p className="flex-1 px-3 text-sv">
                {t('tableHeader.stockQuantity')}
              </p>
              <p className="flex-[0.5] px-3 text-sv">
                {t('tableHeader.stockStatus')}
              </p>
              {!isViewer && hasSubscription() && (
                <p className="w-20 px-3 text-sv">{tCommon('action')}</p>
              )}
            </div>

            {targetMaterials.map((material) => (
              <SubMaterialItem
                key={material.id}
                material={material}
                sourceMaterialId={materialId}
                handleOpenDeleteSubstituteModal={
                  handleOpenDeleteSubstituteModal
                }
              />
            ))}
            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        ) : (
          <NoHistoryBox
            title={t('empty.title')}
            text={t('empty.description')}
            button={t('connectButton')}
            onClick={() => {
              setIsCreateSubstituteModalOpen(true);
            }}
            disabled={isViewer || !hasSubscription()}
          />
        )}
      </div>
    );
  }
);

SubMaterials.displayName = 'SubMaterials';
