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
                <div>회사명</div>
              </div>
              <div className="content">
                <div>{clientData.name}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>사업자등록번호</div>
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
                <div>대표자명</div>
              </div>
              <div className="content">
                <div>{clientData.representative_name}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>납기일자</div>
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
                <div>업태</div>
              </div>
              <div className="content">
                <div>{clientData.business_type}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>종목</div>
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
                <div>이메일</div>
              </div>
              <div className="content">
                <div>{clientData.email}</div>
              </div>
            </div>
            <div className="pdf-table-cell">
              <div className="label">
                <div>연락처</div>
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
                <div>팩스 번호</div>
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
                <div>사업장 주소</div>
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
              <div>품목명</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>품목코드</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>규격</div>
            </div>
            <div style={{ width: '80px' }}>
              <div>단위</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>제작 수량</div>
            </div>
            <div style={{ width: '100px' }}>
              <div>단가</div>
            </div>
            <div style={{ flex: 1 }}>
              <div>금액</div>
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
            <div className="pdf-summary-label">공급가액</div>
            <div className="pdf-summary-value-wrapper">
              <div className="pdf-summary-value">
                {supplyAmount?.toLocaleString() || 0}
              </div>
              <div className="pdf-summary-unit">원</div>
            </div>
          </div>

          <div className="pdf-summary-row">
            <div className="pdf-summary-label">세액(VAT 10%)</div>
            <div className="pdf-summary-value-wrapper">
              <div className="pdf-summary-value">
                {(
                  supplyAmount && Math.floor(supplyAmount / 10)
                )?.toLocaleString() || 0}
              </div>
              <div className="pdf-summary-unit">원</div>
            </div>
          </div>

          <div className="pdf-summary-row">
            <div className="pdf-summary-label">합계금액</div>
            <div className="pdf-summary-value-wrapper">
              <div className="pdf-summary-value">
                {(
                  supplyAmount && Math.floor(supplyAmount / 10) + supplyAmount
                )?.toLocaleString() || 0}
              </div>
              <div className="pdf-summary-unit">원</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDocumentPDFView;
