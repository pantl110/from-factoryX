import { ProjectQuotationModel } from '@/types/data-model';
import DocumentViewTitle from '../document-view-title';
import BuyerInfo from './buyer-info';
import SellerInfo from './seller-info';
import ProductListInfo from '../product-list-info';

interface TransactionDocumentViewProps {
  quotationData: ProjectQuotationModel;
  lastDeliveryDate: string;
}

const TransactionDocumentView = ({
  quotationData,
  lastDeliveryDate,
}: TransactionDocumentViewProps) => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title={`[${quotationData.client_info.name}]건 거래명세서`}
      />
      <SellerInfo
        lastDeliveryDate={lastDeliveryDate}
        factoryData={quotationData.factory_info}
      />
      <BuyerInfo
        quotationData={{
          client_id: quotationData.client_info.id,
          factory_name: quotationData.client_info.name,
          business_registration_number:
            quotationData.client_info.business_registration_number,
          representative_name: quotationData.client_info.representative_name,
          business_type: quotationData.factory_info.business_type,
          business_category: quotationData.factory_info.business_category,
          address: quotationData.factory_info.business_address,
          email: quotationData.client_info.email,
          phone: quotationData.client_info.phone,
          fax: quotationData.client_info.fax,
        }}
      />
      <ProductListInfo
        productListInfoTitle="거래 제품 정보"
        productItems={quotationData.products_info.map((item) => ({
          productId: item.id,
          product_code: item.code,
          product_name: item.name,
          spec: item.spec,
          unit: item.unit,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))}
        supplyAmount={quotationData.products_info.reduce(
          (sum, item) => sum + (item.unit_price * item.quantity || 0),
          0
        )}
      />
    </div>
  );
};

export default TransactionDocumentView;
