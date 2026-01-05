import {
  QuotationProductDetailResponseModel,
  ClientModel,
} from '@/types/data-model';
import { useTranslations } from 'next-intl';
import './pdf-styles.css';

interface OrderDocumentPDFViewProps {
  documentTitle: string;
  clientData: ClientModel;
  dueDate: string;
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
  taxAmount: number;
}

const OrderDocumentPDFView = ({
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
  supplyAmount,
  taxAmount,
}: OrderDocumentPDFViewProps) => {
  const t = useTranslations('common');

  return (
    <div className="pdf-container">
      {/* 문서 제목 */}
      <h2 className="pdf-title">
        [{clientData.name}]건 {documentTitle}
      </h2>

      {/* 거래처 정보 섹션 */}
      <div className="pdf-section">
        <h3 className="pdf-section-title">{t('clientInfo')}</h3>

        <div className="pdf-table">
          {/* 첫 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('clientName')}</div>
              </div>
              <div className="content">
                <div>{clientData.name}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('businessRegistrationNumber')}</div>
              </div>
              <div className="content">
                <div>{clientData.business_registration_number}</div>
              </div>
            </div>
          </div>

          {/* 두 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('representativeName')}</div>
              </div>
              <div className="content">
                <div>{clientData.representative_name}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('dueDate')}</div>
              </div>
              <div className="content">
                <div>{dueDate}</div>
              </div>
            </div>
          </div>

          {/* 세 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('businessType')}</div>
              </div>
              <div className="content">
                <div>{clientData.business_type}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('businessCategory')}</div>
              </div>
              <div className="content">
                <div>{clientData.business_category}</div>
              </div>
            </div>
          </div>

          {/* 네 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('email')}</div>
              </div>
              <div className="content">
                <div>{clientData.email}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('phone')}</div>
              </div>
              <div className="content">
                <div>{clientData.phone}</div>
              </div>
            </div>
          </div>

          {/* 다섯 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('fax')}</div>
              </div>
              <div className="content">
                <div>{clientData.fax || '-'}</div>
              </div>
            </div>
          </div>

          {/* 여섯 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <div>{t('businessAddress')}</div>
              </div>
              <div className="content">
                <div>{clientData.address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 제품 목록 정보 섹션 */}
      <div className="pdf-section">
        <h3 className="pdf-section-title">{productListInfoTitle}</h3>

        <div className="pdf-product-table">
          <div className="pdf-product-table-header">
            <div style={{ flex: 1 }}>
              <div>{t('productName')}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>{t('productCode')}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>{t('specification')}</div>
            </div>
            <div style={{ width: '80px' }}>
              <div>{t('unit')}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>{t('manufacturingQuantity')}</div>
            </div>
            <div style={{ width: '100px' }}>
              <div>{t('unitPrice')}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>{t('amount')}</div>
            </div>
          </div>
          <div>
            {productItems.map((item, index) => (
              <div key={index} className="pdf-product-table-body">
                <div style={{ flex: 1 }}>
                  <div>{item.product_name || '-'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div>{item.product_code || '-'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div>{item.spec || '-'}</div>
                </div>
                <div style={{ width: '80px' }}>
                  <div>{item.unit || '-'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div>{item.quantity?.toLocaleString() || '-'}</div>
                </div>
                <div style={{ width: '100px' }}>
                  <div>{item.unit_price?.toLocaleString() || '-'}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div>
                    {item.quantity && item.unit_price
                      ? (item.quantity * item.unit_price).toLocaleString()
                      : '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 총 금액 정보 */}
        <div className="pdf-summary">
          <div className="pdf-summary-row">
            <div className="pdf-summary-label">{t('supplyAmount')}</div>
            <div className="pdf-summary-value-wrapper">
              <div className="pdf-summary-value">
                {supplyAmount?.toLocaleString() || 0}
              </div>
              <div className="pdf-summary-unit">{t('won')}</div>
            </div>
          </div>

          <div className="pdf-summary-row">
            <div className="pdf-summary-label">{t('taxAmountVAT')}</div>
            <div className="pdf-summary-value-wrapper">
              <div className="pdf-summary-value">
                {taxAmount?.toLocaleString() || 0}
              </div>
              <div className="pdf-summary-unit">{t('won')}</div>
            </div>
          </div>

          <div className="pdf-summary-row">
            <div className="pdf-summary-label">{t('totalAmount')}</div>
            <div className="pdf-summary-value-wrapper">
              <div className="pdf-summary-value">
                {(supplyAmount + taxAmount)?.toLocaleString() || 0}
              </div>
              <div className="pdf-summary-unit">{t('won')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDocumentPDFView;
