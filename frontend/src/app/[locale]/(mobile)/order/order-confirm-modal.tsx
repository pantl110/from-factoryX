import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import MoModal, { MoModalHandleModel } from '@/ui/modal/mo-modal';
import Image from 'next/image';
import MoBtn from '@/ui/mo-btn';
import { useTranslations } from 'next-intl';

interface OrderConfirmModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export interface OrderConfirmModalHandleModel {
  close: () => void;
}

const OrderConfirmModal = forwardRef<
  OrderConfirmModalHandleModel,
  OrderConfirmModalProps
>(({ onClose, onConfirm, isConfirming = false }, ref) => {
  const t = useTranslations('mobile.orderConfirmModal');
  const tCommon = useTranslations('common');
  const modalRef = useRef<MoModalHandleModel>(null);

  const handleClose = () => {
    modalRef.current?.close();
  };

  useImperativeHandle(ref, () => ({
    close: handleClose,
  }));

  return (
    <MoModal ref={modalRef} title={t('title')} onClose={onClose}>
      <div className="flex flex-col gap-3 mb-4 ">
        <div className="flex justify-center mb-3">
          <Image
            src="/order-confirm.png"
            alt={t('title')}
            width={80}
            height={80}
          />
        </div>
        <p className="m-Body-3 text-sv">{t('description1')}</p>
        <p className="m-Body-3 text-sv">{t('description2')}</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <MoBtn
          text={t('confirm')}
          variant="primary"
          width="w-full"
          big={true}
          disabled={isConfirming}
          onClick={onConfirm}
        />
        <MoBtn
          text={tCommon('close')}
          variant="outline"
          width="w-full"
          big={true}
          onClick={handleClose}
        />
      </div>
    </MoModal>
  );
});

OrderConfirmModal.displayName = 'OrderConfirmModal';

export default OrderConfirmModal;
