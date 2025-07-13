'use client'

import { useState } from 'react'
import SearchInput from '@/ui/search-input'
import TableItem from './table-item'
import { CaretUpDownIcon } from '@phosphor-icons/react'
import Pagination from '@/components/pagination'
import usePagination from '@/hooks/use-pagination'
import ReceiptDetailPanel from './modals/receipt-detail-panel'

// 현금영수증 아이템 타입 정의
interface ReceiptItemModel {
  id: number
  date: string
  company: string
  productName: string
  supplyAmount: number
  taxAmount: number
  totalAmount: number
}

const TaxReceiptPage = () => {
  // 정렬 상태 관리
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  // 패널 열기/닫기 상태 관리
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ReceiptItemModel | null>(null)

  const mockData: ReceiptItemModel[] = [
    {
      id: 1,
      date: '2025-01-01',
      company: '플라스틱이 좋아',
      productName: '플라스틱',
      supplyAmount: 100000,
      taxAmount: 10000,
      totalAmount: 110000,
    },
    {
      id: 2,
      date: '2025-01-02',
      company: '플라스틱이 싫어',
      productName: '플라스틱',
      supplyAmount: 100000,
      taxAmount: 10000,
      totalAmount: 110000,
    },
  ]

  // 정렬된 데이터
  const sortedData = [...mockData].sort((a, b) => {
    if (sortOrder === 'asc') {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    } else if (sortOrder === 'desc') {
      return new Date(b.date).getTime() - new Date(a.date).getTime()
    }
    return 0
  })

  // 페이지네이션 훅 사용
  const { currentItems, currentPage, totalPages, setCurrentPage } = usePagination({
    items: sortedData,
    itemsPerPage: 10,
  })

  // 거래일자 정렬 핸들러
  const handleDateSort = () => {
    if (sortOrder === 'desc') {
      setSortOrder('asc')
    } else {
      setSortOrder('desc')
    }
    // 정렬 변경 시 첫 페이지로 이동
    setCurrentPage(1)
  }

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  // 테이블 아이템 클릭 핸들러
  const handleItemClick = (item: ReceiptItemModel) => {
    setSelectedItem(item)
    setIsPanelOpen(true)
  }

  // 패널 닫기 핸들러
  const handlePanelClose = () => {
    setIsPanelOpen(false)
    setSelectedItem(null)
  }

  return (
    <div className="flex flex-col gap-8 pt-10 px-10">
      <div className="Heading-1 text-dg">현금영수증</div>

      <div>
        <SearchInput placeholder="찾고 싶은 현금영수증의 업체명을 입력하세요." />

        <div className="pb-10 mt-6">
          <div className="w-full overflow-x-auto">
            <div className="text-sv flex items-center w-full min-w-[1248px] h-12 border-t border-b border-[#eeeeee] Me_Body-1">
              <div
                className="px-3 flex-1 h-full flex items-center gap-1 hover:bg-bg cursor-pointer"
                onClick={handleDateSort}
              >
                <p className="">거래일자</p>
                <CaretUpDownIcon size={21} className="text-sv" />
              </div>
              <p className="flex-2 px-3">업체명</p>
              <p className="flex-2 px-3">품목명</p>
              <p className="flex-1 px-3">공급가액</p>
              <p className="flex-1 px-3">세액</p>
              <p className="flex-1 px-3">합계금액</p>
            </div>

            {currentItems.map((item) => (
              <TableItem key={item.id} item={item} onClick={() => handleItemClick(item)} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </div>

      {/* 현금영수증 상세 패널 */}
      {isPanelOpen && <ReceiptDetailPanel onClose={handlePanelClose} item={selectedItem} />}
    </div>
  )
}

export default TaxReceiptPage
