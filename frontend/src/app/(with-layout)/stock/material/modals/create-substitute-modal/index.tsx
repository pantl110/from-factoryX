import { useState, useEffect } from 'react';
import Modal from '@/ui/modal/modal';
import SearchInput from '@/ui/search-input';
import Checkbox from '@/ui/checkbox';
import MiniBtn from '@/ui/mini-btn';
import MaterialItem from './material-item';
import {
  useGetMaterialListMutation,
  useCreateSubstituteMutation,
} from '@/hooks';
import { MaterialResponseModel } from '@/types/data-model';
import NoHistoryBox from '@/ui/no-history-box';
import Pagination from '@/components/pagination';

interface CreateSubstituteModalProps {
  materialId: number;
  onClose: () => void;
  onSuccess?: () => void;
}

const CreateSubstituteModal = ({
  materialId,
  onClose,
  onSuccess,
}: CreateSubstituteModalProps) => {
  const getMaterialListMutation = useGetMaterialListMutation();
  const createSubstituteMutation = useCreateSubstituteMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<MaterialResponseModel[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<number>>(
    new Set()
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<{
    pageCnt: number;
    curPage: number;
  } | null>(null);
  const pageSize = 5;

  // 원자재 목록 조회
  const fetchMaterials = async (page: number = 1) => {
    try {
      const params: {
        material_id: number;
        page: number;
        page_size: number;
        q?: string;
      } = {
        material_id: materialId, // 대체자재 필터링
        page,
        page_size: pageSize,
      };

      // 검색어가 있으면 추가
      if (searchTerm.trim()) {
        params.q = searchTerm.trim();
      }

      const result = await getMaterialListMutation.mutateAsync(params);

      setMaterials(result.data || []);
      setPagination({
        pageCnt: result.pageCnt || 1,
        curPage: result.curPage || page,
      });
    } catch (error) {
      console.error('원자재 목록 조회 실패:', error);
      setMaterials([]);
      setPagination(null);
    }
  };

  // 모달이 처음 열릴 때 원자재 목록 조회
  useEffect(() => {
    fetchMaterials(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [materialId]);

  // 검색어 변경 시 원자재 목록 조회 (첫 페이지로)
  useEffect(() => {
    setCurrentPage(1);
    const timer = setTimeout(() => {
      fetchMaterials(1);
    }, 300); // 디바운스

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // 페이지 변경 시 원자재 목록 조회
  useEffect(() => {
    fetchMaterials(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  // 전체 선택/해제
  const handleToggleAll = () => {
    if (selectedMaterialIds.size === materials.length) {
      setSelectedMaterialIds(new Set());
    } else {
      setSelectedMaterialIds(new Set(materials.map((m) => m.id)));
    }
  };

  // 개별 선택/해제
  const handleToggleMaterial = (materialId: number) => {
    const newSelected = new Set(selectedMaterialIds);
    if (newSelected.has(materialId)) {
      newSelected.delete(materialId);
    } else {
      newSelected.add(materialId);
    }
    setSelectedMaterialIds(newSelected);
  };

  const isAllChecked =
    materials.length > 0 && selectedMaterialIds.size === materials.length;

  return (
    <Modal
      onClose={onClose}
      title="대체 가능한 원자재 연결"
      width="w-[800px]"
      height="max-h-[85%]"
      scroll={true}
    >
      <div className="mt-4 mb-3 px-6">
        <SearchInput
          placeholder="연결할 원자재 또는 코드를 검색하세요."
          width="w-full"
          value={searchTerm}
          onChange={setSearchTerm}
        />
      </div>

      <div className="px-6 max-h-[calc(85vh-140px)] overflow-y-auto scrollbar-hide">
        {/* 표 */}
        {materials.length === 0 && getMaterialListMutation.isPending ? (
          <div className="h-50" />
        ) : materials.length === 0 ? (
          <NoHistoryBox text="연결할 원자재가 없습니다." />
        ) : (
          <>
            <div className="flex items-center h-12 border-t border-b border-lg Me_Body-1 cursor-default">
              <Checkbox
                isChecked={isAllChecked}
                onToggle={
                  materials.length > 0 && !getMaterialListMutation.isPending
                    ? handleToggleAll
                    : () => {}
                }
              />
              <p className="flex-1 px-3 text-sv">자재명</p>
              <p className="flex-1 px-3 text-sv">자재코드</p>
              <p className="flex-1 px-3 text-sv">규격</p>
              <p className="flex-1 px-3 text-sv">단위</p>
            </div>

            {materials.map((material) => (
              <MaterialItem
                key={material.id}
                material={material}
                isChecked={selectedMaterialIds.has(material.id)}
                onToggle={
                  !getMaterialListMutation.isPending
                    ? () => handleToggleMaterial(material.id)
                    : () => {}
                }
              />
            ))}

            {/* 페이지네이션 */}
            {pagination && pagination.pageCnt > 1 && (
              <Pagination
                currentPage={pagination.curPage}
                totalPages={pagination.pageCnt}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}

        {/* 버튼 */}
        <div className="flex gap-2.5 justify-end mt-3 pb-6">
          <MiniBtn text="닫기" variant="white" onClick={onClose} />
          <MiniBtn
            text="연결"
            variant="primary"
            onClick={async () => {
              if (selectedMaterialIds.size === 0) return;

              try {
                await createSubstituteMutation.mutateAsync({
                  source_material_id: materialId,
                  target_materials: Array.from(selectedMaterialIds),
                });

                // 성공 시 모달 닫기 및 부모 컴포넌트에 알림
                onSuccess?.();
                onClose();
              } catch {
                // TODO: 에러 메시지 표시 (토스트 등)
              }
            }}
            disabled={
              selectedMaterialIds.size === 0 ||
              createSubstituteMutation.isPending
            }
          />
        </div>
      </div>
    </Modal>
  );
};

export default CreateSubstituteModal;
