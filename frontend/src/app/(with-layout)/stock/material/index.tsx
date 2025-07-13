'use client'

import TableHeader from './table-header'
import TableItem from './table-item'
import SearchInput from '@/ui/search-input'
import MiniBtn from '@/ui/mini-btn'
import DeleteModal from '@/ui/modal/delete-modal'
import { useState } from 'react'
import { useCheckAll } from '@/hooks/use-check-all'

interface MaterialProps {
  setIsMaterialDetailOpen: (v: boolean) => void
}

const Material = ({ setIsMaterialDetailOpen }: MaterialProps) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const currentIds = [1, 2, 3, 4, 5]

  const {
    checkedCount,
    isAllChecked,
    isChecked,
    toggleAll,
    toggleOne,
    setAllChecked,
    getDeleteButtonText,
  } = useCheckAll(currentIds)

  return (
    <>
      <div className="flex items-center justify-between pb-4">
        <SearchInput />
        <div className="flex gap-1">
          <MiniBtn
            text="취소"
            textColor="text-dg"
            borderColor="border-lg"
            bgColor="bg-white"
            hoverColor="hover:bg-bg"
            onClick={() => setAllChecked(false)}
          />
          <MiniBtn
            text={getDeleteButtonText()}
            textColor={checkedCount > 0 ? 'text-red' : 'text-dg'}
            borderColor={checkedCount > 0 ? 'border-none' : 'border-lg'}
            bgColor={checkedCount > 0 ? 'bg-red-8' : 'bg-wh'}
            hoverColor={checkedCount > 0 ? 'hover:bg-red-hover' : 'hover:bg-bg'}
            onClick={checkedCount > 0 ? () => setIsDeleteModalOpen(true) : () => {}}
          />
        </div>
      </div>

      <div>
        <TableHeader isAllChecked={isAllChecked} onToggleAll={toggleAll} />
        <TableItem
          materialName="알루미늄 시트"
          materialCode="RM-001"
          unit="EA"
          currentStock={5000}
          status="충분"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          checked={isChecked(1)}
          onToggle={() => toggleOne(1)}
        />
        <TableItem
          materialName="투명 필름지"
          materialCode="RM-002"
          unit="m"
          currentStock={1200}
          status="부족"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          checked={isChecked(2)}
          onToggle={() => toggleOne(2)}
        />
        <TableItem
          materialName="실리콘 고무 패킹"
          materialCode="RM-018"
          unit="EA"
          currentStock={3500}
          status="충분"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          checked={isChecked(3)}
          onToggle={() => toggleOne(3)}
        />
        <TableItem
          materialName="절연 테이프"
          materialCode="RM-027"
          unit="롤"
          currentStock={80}
          status="부족"
          _date="2025-06-04"
          onClick={() => setIsMaterialDetailOpen(true)}
          checked={isChecked(4)}
          onToggle={() => toggleOne(4)}
        />
      </div>

      {isDeleteModalOpen && <DeleteModal onClose={() => setIsDeleteModalOpen(false)} />}
    </>
  )
}

export default Material
