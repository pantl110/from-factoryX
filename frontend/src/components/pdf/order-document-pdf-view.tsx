import {
  QuotationProductDetailResponseModel,
  ClientModel,
} from '@/types/data-model';
import './pdf-styles.css';

interface OrderDocumentPDFViewProps {
  documentTitle: string;
  clientData: ClientModel;
  dueDate: string;
  productListInfoTitle: string;
  productItems: QuotationProductDetailResponseModel[];
  supplyAmount: number;
}

const OrderDocumentPDFView = ({
  documentTitle,
  clientData,
  dueDate,
  productListInfoTitle,
  productItems,
  supplyAmount,
}: OrderDocumentPDFViewProps) => {
  return (
    <div className="pdf-container">
      {/* 문서 제목 */}
      <h2 className="pdf-title">
        [{clientData.name}]건 {documentTitle}
      </h2>

      {/* 거래처 정보 섹션 */}
      <div className="pdf-section">
        <h3 className="pdf-section-title">거래처 정보</h3>

        <div className="pdf-table">
          {/* 첫 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <p>회사명</p>
              </div>
              <div className="content">
                <p>{clientData.name}</p>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <p>사업자등록번호</p>
              </div>
              <div className="content">
                <p>{clientData.business_registration_number}</p>
              </div>
            </div>
          </div>

          {/* 두 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <p>대표자명</p>
              </div>
              <div className="content">
                <p>{clientData.representative_name}</p>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <p>납기일자</p>
              </div>
              <div className="content">
                <p>{dueDate}</p>
              </div>
            </div>
          </div>

          {/* 세 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <p>업태</p>
              </div>
              <div className="content">
                <p>{clientData.business_type}</p>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <p>종목</p>
              </div>
              <div className="content">
                <p>{clientData.business_category}</p>
              </div>
            </div>
          </div>

          {/* 네 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <p>이메일</p>
              </div>
              <div className="content">
                <p>{clientData.email}</p>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <p>연락처</p>
              </div>
              <div className="content">
                <p>{clientData.phone}</p>
              </div>
            </div>
          </div>

          {/* 다섯 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <p>팩스 번호</p>
              </div>
              <div className="content">
                <p>{clientData.fax || '-'}</p>
              </div>
            </div>
          </div>

          {/* 여섯 번째 행 */}
          <div className="pdf-table-row">
            <div className="pdf-table-cell">
              <div className="label">
                <p>사업장 주소</p>
              </div>
              <div className="content">
                <p>{clientData.address}</p>
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
              <p>품목명</p>
            </div>
            <div style={{ flex: 1 }}>
              <p>품목코드</p>
            </div>
            <div style={{ flex: 1 }}>
              <p>규격</p>
            </div>
            <div style={{ width: '80px' }}>
              <p>단위</p>
            </div>
            <div style={{ flex: 1 }}>
              <p>제작 수량</p>
            </div>
            <div style={{ width: '100px' }}>
              <p>단가</p>
            </div>
            <div style={{ flex: 1 }}>
              <p>금액</p>
            </div>
          </div>
          <div>
            {productItems.map((item, index) => (
              <div key={index} className="pdf-product-table-body">
                <p style={{ flex: 1 }}>{item.product_name || '-'}</p>
                <p style={{ flex: 1 }}>{item.product_code || '-'}</p>
                <p style={{ flex: 1 }}>{item.spec || '-'}</p>
                <p style={{ width: '80px' }}>{item.unit || '-'}</p>
                <p style={{ flex: 1 }}>
                  {item.quantity?.toLocaleString() || '-'}
                </p>
                <p style={{ width: '100px' }}>
                  {item.unit_price?.toLocaleString() || '-'}
                </p>
                <p style={{ flex: 1 }}>
                  {item.quantity && item.unit_price
                    ? (item.quantity * item.unit_price).toLocaleString()
                    : '-'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 총 금액 정보 */}
        <div className="pdf-summary">
          <div className="pdf-summary-row">
            <div className="pdf-summary-label">공급가액</div>
            <div className="pdf-summary-value-wrapper">
              <p className="pdf-summary-value">
                {supplyAmount?.toLocaleString() || 0}
              </p>
              <p className="pdf-summary-unit">원</p>
            </div>
          </div>

          <div className="pdf-summary-row">
            <div className="pdf-summary-label">세액(VAT 10%)</div>
            <div className="pdf-summary-value-wrapper">
              <p className="pdf-summary-value">
                {(
                  supplyAmount && Math.floor(supplyAmount / 10)
                )?.toLocaleString() || 0}
              </p>
              <p className="pdf-summary-unit">원</p>
            </div>
          </div>

          <div className="pdf-summary-row">
            <div className="pdf-summary-label">합계금액</div>
            <div className="pdf-summary-value-wrapper">
              <p className="pdf-summary-value">
                {(
                  supplyAmount && Math.floor(supplyAmount / 10) + supplyAmount
                )?.toLocaleString() || 0}
              </p>
              <p className="pdf-summary-unit">원</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDocumentPDFView;
