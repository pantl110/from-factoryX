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

    // 삭제 후 현재 페이지가 총 페이지 수보다 크면 이전 페이지로 이동
    useEffect(() => {
      if (totalPages > 0 && currentPage > totalPages) {
        setCurrentPage(totalPages);
      }
    }, [totalPages, currentPage]);

    return (
      <div className="flex flex-col gap-3">
        <div className="h-10 flex items-center justify-between">
          <h3 className="Heading-3 text-dg">대체 가능한 원자재</h3>
          {targetMaterials.length > 0 && (
            <MiniBtn
              text="원자재 연결"
              variant="whiteOutline"
              disabled={isViewer || !hasSubscription()}
              onClick={() => {
                setIsCreateSubstituteModalOpen(true);
              }}
            />
          )}
        </div>

        {/* 데이터가 있는 경우 */}
        {!isLoading && !error && targetMaterials.length > 0 ? (
          <div className="flex flex-col">
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
              <p className="flex-1 px-3 text-sv">자재명</p>
              <p className="flex-1 px-3 text-sv">자재코드</p>
              <p className="flex-1 px-3 text-sv">규격</p>
              <p className="flex-1 px-3 text-sv">재고 수량</p>
              <p className="flex-[0.5] px-3 text-sv">재고 상태</p>
              {!isViewer && hasSubscription() && (
                <p className="w-20 px-3 text-sv">액션</p>
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
            title="연결된 자재가 없어요."
            text="현재 자재 대신 사용할 수 있는 원자재를 등록할 수 있어요."
            button="원자재 연결"
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
