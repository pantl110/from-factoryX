'use client';

import Topbar from '../topbar';
import ClientInfo from '../client-info';
import QuotationProductInfo from './quotation-product-info';
import DeliveryInfo from '../delivery-info';

const DeliveryPage = () => {
  return (
    <div className="pb-8">
      <Topbar title="납기 상세 조회" />
      <ClientInfo />
      <div className="h-2 bg-bg" />
      <QuotationProductInfo />
      <div className="h-2 bg-bg" />
      <DeliveryInfo />
    </div>
  );
};

export default DeliveryPage;
