'use client'

import SearchInput from '@/ui/search-input'
import MiniBtn from '@/ui/mini-btn'

interface SearchDeleteTableProps {
  placeholder?: string
  checkedCount: number
  deleteButtonText: string
  onDelete: () => void
  onCancel: () => void
}

const SearchDeleteTable = ({
  placeholder,
  checkedCount,
  deleteButtonText,
  onDelete,
  onCancel,
}: SearchDeleteTableProps) => {
  return (
    <div className="flex items-center justify-between pb-4">
      <SearchInput value="" onChange={() => {}} placeholder={placeholder} />
      <div className="flex gap-1">
        <MiniBtn
          text="취소"
          textColor="text-dg"
          borderColor="border-lg"
          bgColor="bg-white"
          hoverColor="hover:bg-bg"
          onClick={onCancel}
        />
        <MiniBtn
          text={deleteButtonText}
          textColor={checkedCount > 0 ? 'text-red' : 'text-dg'}
          borderColor={checkedCount > 0 ? '' : 'border-lg'}
          bgColor={checkedCount > 0 ? 'bg-red-8' : 'bg-white'}
          hoverColor={checkedCount > 0 ? 'hover:bg-red-hover' : 'hover:bg-bg'}
          onClick={checkedCount > 0 ? onDelete : () => {}}
        />
      </div>
    </div>
  )
}

export default SearchDeleteTable
