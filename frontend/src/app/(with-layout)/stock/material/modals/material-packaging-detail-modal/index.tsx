import { Modal, MiniBtn } from '@/ui';
import { InputArea } from './input-area';
import { UsageHistory } from './usage-history';

interface MaterialPackagingDetailModalProps {
  mode: 'create' | 'update';
  onClose: () => void;
}

export const MaterialPackagingDetailModal = ({
  mode,
  onClose,
}: MaterialPackagingDetailModalProps) => {
  return (
    <Modal onClose={onClose} width="w-[800px]" title="[LOT-20250910-01-01]">
      {/* 상세정보 */}
      <div className="mt-4 flex flex-col gap-3">
        <h4 className="Heading-4">상세정보</h4>
        <InputArea mode={mode} />
        {mode === 'update' && (
          <div className="flex justify-between items-center p-5 bg-bg rounded-[12px]">
            <p className="Me_Body-2 text-red">
              삭제 시 기록과 재고 차감은 복구되지 않아요
            </p>
            <MiniBtn text="삭제" variant="red" />
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
    </Modal>
  );
};
