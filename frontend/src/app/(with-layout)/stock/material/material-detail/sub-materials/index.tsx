import MiniBtn from '@/ui/mini-btn';
import useMemberStore from '@/store/member-store';
import useSubscriptionStore from '@/store/subscription-store';
import { SubMaterialItem } from './sub-material-item';
import { useSubstitutesByMaterialQuery } from '@/hooks';
import { MaterialSimpleModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';

interface SubMaterialsProps {
  materialId: number;
}
export const SubMaterials = ({ materialId }: SubMaterialsProps) => {
  const role = useMemberStore((state) => state.role);
  const isViewer = role === 'viewer';
  const hasSubscription = useSubscriptionStore(
    (state) => state.hasSubscription
  );

  // 이 자재가 source_material인 대체 자재 관계들 조회
  const {
    data: substituteRelations,
    isLoading,
    error,
  } = useSubstitutesByMaterialQuery(materialId);

  // target_materials
  const targetMaterials: MaterialSimpleModel[] =
    substituteRelations?.[0]?.target_materials || [];

  return (
    <div className="flex flex-col gap-3">
      <div className="h-10 flex items-center justify-between">
        <h3 className="Heading-3 text-dg">대체 가능한 원자재</h3>
        <MiniBtn
          text="원자재 연결"
          variant="whiteOutline"
          disabled={isViewer || !hasSubscription()}
          onClick={() => {}}
        />
      </div>

      {/* 데이터가 없는 경우 (로딩 중이 아니고 에러가 없을 때, API 호출이 안 된 경우 포함) */}
      {!isLoading &&
        !error &&
        (!substituteRelations || targetMaterials.length === 0) && (
          <NoHistoryBox
            title="연결된 자재가 없어요."
            text="현재 자재 대신 사용할 수 있는 원자재를 등록할 수 있어요."
            button="원자재 연결"
            onClick={() => {}}
            disabled={isViewer || !hasSubscription()}
          />
        )}

      {/* 데이터가 있는 경우 */}
      {!isLoading && !error && targetMaterials.length > 0 && (
        <div className="flex flex-col">
          <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
            <p className="flex-1 px-3 text-sv">자재명</p>
            <p className="flex-1 px-3 text-sv">자재코드</p>
            <p className="flex-1 px-3 text-sv">규격</p>
            <p className="flex-1 px-3 text-sv">단위</p>
            <p className="flex-1 px-3 text-sv">재고 수량</p>
            <p className="flex-1 px-3 text-sv">재고 상태</p>
            {!isViewer && hasSubscription() && (
              <p className="w-20 px-3 text-sv">액션</p>
            )}
          </div>

          {targetMaterials.map((material) => (
            <SubMaterialItem key={material.id} material={material} />
          ))}
          {/* 페이지네이션 필요 */}
        </div>
      )}
    </div>
  );
};
