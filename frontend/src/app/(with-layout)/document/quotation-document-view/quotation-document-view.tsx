import DocumentViewTitle from '../document-view-title'
import ProductListInfo from '../product-list-info'
import SupplierInfo from '../supplier-info'

const QuotationDocumentView = () => {
  return (
    <div className="flex flex-col gap-6">
      <DocumentViewTitle
        title="[플라스틱이 좋아]건 견적서"
        dateLabel="발송일자"
        date="2025-07-31"
      />
      <SupplierInfo dateLabel="견적일자" />
      <ProductListInfo />
    </div>
  )
}

export default QuotationDocumentView
