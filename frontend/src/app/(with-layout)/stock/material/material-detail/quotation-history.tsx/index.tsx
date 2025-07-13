import QuotationHistoryItem from './quotation-history-item'

interface QuotationHistoryProps {
  setIsCustomerInfoModalOpen: (isOpen: boolean) => void
}

const QuotationHistory = ({ setIsCustomerInfoModalOpen }: QuotationHistoryProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center h-12 border-t border-b border-[#eeeeee] Me_Body-1">
        <p className="flex-1 px-3 text-sv">거래처명</p>
        <p className="flex-1 px-3 text-sv">수량</p>
        <p className="flex-1 px-3 text-sv">단가</p>
        <p className="flex-1 text-sv px-3">금액</p>
        <p className="Re_Body-1 text-sv px-3 opacity-0">상세보기</p>
      </div>
      <QuotationHistoryItem
        onClick={() => setIsCustomerInfoModalOpen(true)}
        clientName="플라스틱이 좋아"
        quantity={500}
        unitPrice={1200}
      />
    </div>
  )
}

export default QuotationHistory
