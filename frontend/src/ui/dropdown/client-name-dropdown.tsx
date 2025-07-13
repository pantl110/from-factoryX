import { ClientDataModel } from '@/types/data-model'
import Dropdown from '@/ui/dropdown/dropdown'
import DropdownItem from '@/ui/dropdown/dropdown-item'

export const ClientNameDropdown = ({
  items,
  onSelect,
  width,
  style,
}: {
  items: ClientDataModel[]
  onSelect: (item: ClientDataModel) => void
  width?: string
  style?: React.CSSProperties
}) => {
  return (
    <Dropdown onClose={() => {}} width={width} style={style}>
      {items.slice(0, 6).map((item) => (
        <DropdownItem
          key={item.id}
          text={item.companyName}
          onClick={() => onSelect(item)}
          search={true}
        />
      ))}
    </Dropdown>
  )
}
