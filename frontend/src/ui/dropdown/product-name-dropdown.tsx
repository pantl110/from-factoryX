import { ProductDataModel } from '@/types/data-model'
import Dropdown from '@/ui/dropdown/dropdown'
import DropdownItem from '@/ui/dropdown/dropdown-item'
import React from 'react'

export const ProductNameDropdown = ({
  items,
  onSelect,
  width,
}: {
  items: ProductDataModel[]
  onSelect: (item: ProductDataModel) => void
  width?: string
}) => {
  return (
    <Dropdown onClose={() => {}} width={width}>
      {items.slice(0, 6).map((item) => (
        <DropdownItem
          key={item.id}
          text={item.productName}
          onClick={() => onSelect(item)}
          search={true}
        />
      ))}
    </Dropdown>
  )
}
