import { InfoLabelValue, MiniBtn, Modal } from '@/ui';

interface MaterialStockInDetailModalProps {
  historyId: number | null;
  onClose: () => void;
}

export const MaterialStockInDetailModal = ({
  historyId,
  onClose,
}: MaterialStockInDetailModalProps) => {
  return (
    <>
      <Modal
        onClose={onClose}
        width="w-[800px]"
        title="[LOT 번호]"
        scroll={true}
      >
        {/* 상세정보 */}
        <div className="flex flex-col gap-3">
          <h4 className="Heading-4">상세정보</h4>
          <form>
            <InfoLabelValue label="부모 LOT 번호" disabled />
            <InfoLabelValue label="소분 LOT 번호" disabled />
          </form>

          {/* 버튼 */}
          <div className="flex justify-end gap-2.5 mt-5">
            <MiniBtn text="취소" variant="white" onClick={onClose} />
            <MiniBtn text="수정" variant="secondary" />
          </div>
        </div>
      </Modal>
    </>
  );
};
