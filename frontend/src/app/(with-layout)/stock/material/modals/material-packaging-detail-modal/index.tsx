import { Modal, MiniBtn, DeleteModal } from '@/ui';
import { InputArea } from './input-area';
import { UsageHistory } from './usage-history';
import {
  useGetMaterialRepackagingDetail,
  useDeleteMaterialRepackaging,
} from '@/hooks';
import { useState } from 'react';

interface MaterialPackagingDetailModalProps {
  mode: 'create' | 'update';
  materialId: number;
  repackagingId?: number | null;
  onClose: () => void;
}

export const MaterialPackagingDetailModal = ({
  mode,
  materialId,
  repackagingId,
  onClose,
}: MaterialPackagingDetailModalProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const deleteMutation = useDeleteMaterialRepackaging();

  // update 모드일 때 repackaging 상세 데이터 가져오기 (제목용)
  const { data: repackaging } = useGetMaterialRepackagingDetail(
    mode === 'update' && repackagingId ? repackagingId : null
  );

  const modalTitle = repackaging
    ? `[${repackaging.lot_number}]`
    : '[소분 LOT 번호]';

  const handleDelete = async () => {
    if (!repackagingId) return;

    try {
      await deleteMutation.mutateAsync(repackagingId);
      setIsDeleteModalOpen(false);
      onClose();
    } catch (error) {
      // 에러는 mutation에서 처리됨
    }
  };

  return (
    <Modal onClose={onClose} width="w-[800px]" title={modalTitle}>
      {/* 상세정보 */}
      <div className="mt-4 flex flex-col gap-3">
        <h4 className="Heading-4">상세정보</h4>
        <InputArea
          mode={mode}
          materialId={materialId}
          repackagingId={repackagingId}
        />

        {/* 삭제 버튼 */}
        {mode === 'update' && (
          <div className="flex justify-between items-center p-5 bg-bg rounded-[12px]">
            <p className="Me_Body-2 text-red">
              삭제 시 기록과 재고 차감은 복구되지 않아요
            </p>
            <MiniBtn
              text="삭제"
              variant="red"
              onClick={() => setIsDeleteModalOpen(true)}
            />
          </div>
        )}
      </div>

      {/* 소분된 원자재 사용 내역 */}
      {mode === 'update' && <UsageHistory />}

      {/* 버튼 */}
      {mode === 'create' && (
        <div className="flex justify-end gap-2.5 mt-5">
          <MiniBtn text="취소" variant="white" onClick={onClose} />
          <MiniBtn text="소분" variant="secondary" onClick={onClose} />
        </div>
      )}
      {mode === 'update' && (
        <div className="flex justify-end gap-2.5 mt-5">
          <MiniBtn text="취소" variant="white" onClick={onClose} />
          <MiniBtn text="수정" variant="secondary" onClick={onClose} />
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {isDeleteModalOpen && (
        <DeleteModal
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      )}
    </Modal>
  );
};
