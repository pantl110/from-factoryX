import { Modal, MiniBtn, DeleteModal, Toast } from '@/ui';
import { InputArea } from './input-area';
import { UsageHistory } from './usage-history';
import {
  useGetMaterialRepackagingDetail,
  useDeleteMaterialRepackaging,
  useToast,
} from '@/hooks';
import { useEffect, useState, useCallback } from 'react';
import { CheckCircle, WarningCircle } from '@phosphor-icons/react';

interface MaterialPackagingDetailModalProps {
  repackagingId?: number | null;
  nextRepackagingLotNumber?: string | null;
  parentHistoryId?: number | null;
  onClose: () => void;
  onRepackagingUpdated?: () => void;
}

export const MaterialPackagingDetailModal = ({
  repackagingId,
  nextRepackagingLotNumber,
  parentHistoryId,
  onClose,
  onRepackagingUpdated,
}: MaterialPackagingDetailModalProps) => {
  const mode = repackagingId ? 'update' : 'create';
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isErrorToast, setIsErrorToast] = useState(false);
  const [toastText, setToastText] = useState('');
  const [toastSubtext, setToastSubtext] = useState('');
  const [shouldCloseAfterToast, setShouldCloseAfterToast] = useState(false);
  const [isQuantityFilled, setIsQuantityFilled] = useState(false);

  const { isToastOpen, isVisible, showToast } = useToast();

  const deleteMutation = useDeleteMaterialRepackaging();
  const formId = 'material-packaging-form';

  // update 모드일 때 repackaging 상세 데이터 가져오기 (제목용)
  const { data: repackaging } = useGetMaterialRepackagingDetail(
    repackagingId ?? null
  );

  const modalTitle =
    mode === 'update' && repackaging
      ? `[${repackaging.lot_number}]`
      : mode === 'create' && nextRepackagingLotNumber
        ? `[${nextRepackagingLotNumber}]`
        : '[]';

  const showToastMessage = useCallback(
    (
      text: string,
      subtext: string,
      type: 'success' | 'error' = 'success',
      triggerClose: boolean = false
    ) => {
      setToastText(text);
      setToastSubtext(subtext);
      setIsErrorToast(type === 'error');
      setShouldCloseAfterToast(triggerClose);
      showToast();
    },
    [showToast]
  );

  const handleUpdateSuccess = useCallback(() => {
    showToastMessage(
      '수정이 완료되었습니다.',
      '수정된 내용이 저장되었어요.',
      'success',
      true
    );
    onRepackagingUpdated?.();
  }, [showToastMessage, onRepackagingUpdated]);

  const handleCreateSuccess = useCallback(() => {
    showToastMessage(
      '소분 내역이 생성되었습니다.',
      '소분 내역은 원자재 소분 내역에서 확인할 수 있어요.',
      'success',
      true
    );
    onRepackagingUpdated?.();
  }, [showToastMessage, onRepackagingUpdated]);

  const handleError = useCallback(
    (message: { text: string; subtext: string }) => {
      showToastMessage(message.text, message.subtext, 'error');
    },
    [showToastMessage]
  );

  useEffect(() => {
    if (shouldCloseAfterToast && !isToastOpen) {
      setShouldCloseAfterToast(false);
      onClose();
    }
  }, [shouldCloseAfterToast, isToastOpen, onClose]);

  const handleDelete = async () => {
    if (!repackagingId) return;

    try {
      await deleteMutation.mutateAsync(repackagingId);
      if (onRepackagingUpdated) {
        await onRepackagingUpdated();
      }
      setIsDeleteModalOpen(false);
      onClose();
    } catch {
      // 에러는 mutation에서 처리됨
    }
  };

  return (
    <>
      <Modal
        onClose={onClose}
        width="w-[800px]"
        title={modalTitle}
        scroll={true}
      >
        <div className="pt-4 px-6 pb-6 max-h-[calc(85vh-68px)] overflow-y-auto scrollbar-hide">
          {/* 상세정보 */}
          <div className="flex flex-col gap-3">
            <h4 className="Heading-4">상세정보</h4>
            <InputArea
              repackagingId={repackagingId}
              nextRepackagingLotNumber={nextRepackagingLotNumber}
              parentHistoryId={parentHistoryId}
              formId={formId}
              onUpdateSuccess={
                mode === 'create' ? handleCreateSuccess : handleUpdateSuccess
              }
              onError={handleError}
              onQuantityChange={setIsQuantityFilled}
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
          {mode === 'update' && repackagingId && (
            <UsageHistory repackagingId={repackagingId} />
          )}

          {/* 버튼 */}
          {mode === 'create' && (
            <div className="flex justify-end gap-2.5 mt-5">
              <MiniBtn text="취소" variant="white" onClick={onClose} />
              <MiniBtn
                text="소분"
                variant="secondary"
                type="submit"
                form={formId}
                disabled={!isQuantityFilled}
              />
            </div>
          )}
          {mode === 'update' && (
            <div className="flex justify-end gap-2.5 mt-5">
              <MiniBtn text="취소" variant="white" onClick={onClose} />
              <MiniBtn
                text="수정"
                variant="secondary"
                type="submit"
                form={formId}
                disabled={!isQuantityFilled}
              />
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
        </div>
      </Modal>

      {isToastOpen && (
        <Toast
          icon={
            isErrorToast ? (
              <WarningCircle size={20} className="text-red" />
            ) : (
              <CheckCircle size={20} className="text-primary" />
            )
          }
          text={toastText}
          subtext={toastSubtext}
          type={isErrorToast ? 'red' : 'primary'}
          isVisible={isVisible}
        />
      )}
    </>
  );
};
