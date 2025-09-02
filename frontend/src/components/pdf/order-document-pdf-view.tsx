import DocumentViewTitle from '../../app/(with-layout)/document/document-view-title';
import {
  QuotationProductDetailResponseModel,
  ClientModel,
} from '@/types/data-model';

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
    <div className="flex flex-col gap-6">
      <DocumentViewTitle title={`[${clientData.name}]건 ${documentTitle}`} />

      {/* 거래처 정보 섹션 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">거래처 정보</h3>
        <div className="width-full border-b border-lg">
          <div className="flex">
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3 items-center">
                <div className="text-sv Me_Body-1">회사명</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {clientData.name}
                </div>
              </div>
            </div>
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                <div className="text-sv Me_Body-1">사업자등록번호</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {clientData.business_registration_number}
                </div>
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                <div className="text-sv Me_Body-1">대표자명</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {clientData.representative_name}
                </div>
              </div>
            </div>
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                <div className="text-sv Me_Body-1">납기일자</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {dueDate}
                </div>
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                <div className="text-sv Me_Body-1">업태</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {clientData.business_type}
                </div>
              </div>
            </div>
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                <div className="text-sv Me_Body-1">종목</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {clientData.business_category}
                </div>
              </div>
            </div>
          </div>
          <div className="flex">
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                <div className="text-sv Me_Body-1">이메일</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {clientData.email}
                </div>
              </div>
            </div>
            <div className="flex w-full Me_Body-1 border-t border-lg">
              <div className="w-[137px] bg-lg-table flex gap-2 p-3">
                <div className="text-sv Me_Body-1">연락처</div>
              </div>
              <div className="flex-1 flex items-center">
                <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                  {clientData.phone}
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full Me_Body-1 border-t border-lg">
            <div className="w-[137px] bg-lg-table flex gap-2 p-3">
              <div className="text-sv Me_Body-1">팩스 번호</div>
            </div>
            <div className="flex-1 flex items-center">
              <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                {clientData.fax || '-'}
              </div>
            </div>
          </div>
          <div className="flex w-full Me_Body-1 border-t border-lg">
            <div className="w-[137px] bg-lg-table flex gap-2 p-3">
              <div className="text-sv Me_Body-1">사업장 주소</div>
            </div>
            <div className="flex-1 flex items-center">
              <div className="text-dg px-3 flex-1 flex items-center Me_Body-1">
                {clientData.address}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 제품 목록 정보 섹션 */}
      <div className="flex flex-col gap-3">
        <h3 className="Heading-3 h-10 items-center flex">
          {productListInfoTitle}
        </h3>

        <table>
          <thead>
            <tr className="flex items-center h-12 border-t border-b border-lg Me_Body-1 text-sv rounded-sm">
              <th className="text-left px-3 flex-1">품목명</th>
              <th className="text-left px-3 flex-1">품목코드</th>
              <th className="text-left px-3 flex-1">수량</th>
              <th className="text-left px-3 w-[100px]">단가</th>
              <th className="text-left px-3 flex-1">금액</th>
            </tr>
          </thead>
          <tbody>
            {productItems.map((item, index) => (
              <tr
                key={index}
                className="flex items-center h-12 border-b border-lg"
              >
                <td className="text-left px-3 flex-1 flex items-center">
                  {item.product_name}
                </td>
                <td className="text-left px-3 flex-1 flex items-center">
                  {item.product_code || '-'}
                </td>
                <td className="text-left px-3 flex-1 flex items-center">
                  {item.quantity}
                </td>
                <td className="text-left px-3 w-[100px] flex items-center">
                  {item.unit_price?.toLocaleString()}원
                </td>
                <td className="text-left px-3 flex-1 flex items-center">
                  {item.supply_amount?.toLocaleString()}원
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 총 금액 정보 */}
        <div className="flex flex-col gap-4 bg-lg-table px-4 py-4 rounded-lg w-full">
          <div className="flex w-full justify-between items-center">
            <span className="w-[150px] Me_Body-1 text-sv">공급가액</span>
            <span className="text-primary Me_Body-3">
              {supplyAmount?.toLocaleString() || 0}
              <span className="text-sv Me_Body-2">원</span>
            </span>
          </div>
          <div className="flex w-full justify-between items-center">
            <span className="w-[150px] Me_Body-1 text-sv">세액(VAT 10%)</span>
            <span className="text-primary Me_Body-3">
              {(
                supplyAmount && Math.floor(supplyAmount / 10)
              )?.toLocaleString() || 0}
              <span className="text-sv Me_Body-2">원</span>
            </span>
          </div>
          <div className="flex w-full justify-between items-center">
            <span className="w-[150px] Me_Body-1 text-sv">합계금액</span>
            <span className="text-primary Me_Body-3">
              {(
                supplyAmount && Math.floor(supplyAmount / 10) + supplyAmount
              )?.toLocaleString() || 0}
              <span className="text-sv Me_Body-2">원</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDocumentPDFView;
