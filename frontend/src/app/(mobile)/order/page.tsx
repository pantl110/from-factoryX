'use client';

import Topbar from '../topbar';
import ClientInfo from '../client-info';
import OrderInfo from './order-info';
import DeliveryInfo from '../delivery-info';
import MoBtn from '@/ui/mo-btn';
import { useState } from 'react';
import OrderConfirmModal from './order-confirm-modal';

const OrderPage = () => {
  const [isOrderConfirmModalOpen, setIsOrderConfirmModalOpen] = useState(false);
  return (
    <>
      <div className="pb-8">
        <Topbar title="확정 필요 주문" />
        <ClientInfo />
        <div className="h-2 bg-bg" />
        <OrderInfo />
        <div className="h-2 bg-bg" />
        <DeliveryInfo isOrderPage={true} />
        <div className="h-2 bg-bg" />
        <div className="px-7 py-8">
          <MoBtn
            text="주문 확정"
            variant="primary"
            width="w-full"
            big={true}
            onClick={() => {
              setIsOrderConfirmModalOpen(true);
            }}
          />
        </div>
      </div>
      {isOrderConfirmModalOpen && (
        <OrderConfirmModal
          onClose={() => setIsOrderConfirmModalOpen(false)}
          onConfirm={() => setIsOrderConfirmModalOpen(false)}
        />
      )}
    </>
  );
};

export default OrderPage;
