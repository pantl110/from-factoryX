import Dropdown from '@/ui/dropdown/dropdown'
import DropdownItem from '@/ui/dropdown/dropdown-item'

interface MaterialAddDropdownProps {
  onClose: () => void
  onOpenExcelModal: () => void
  onOpenClientInfoModal: () => void
}

const MaterialAddDropdown = ({
  onClose,
  onOpenExcelModal,
  onOpenClientInfoModal,
}: MaterialAddDropdownProps) => {
  return (
    <Dropdown onClose={onClose}>
      <DropdownItem text="개별 자재 추가" onClick={onOpenClientInfoModal} />{' '}
      <DropdownItem text="엑셀로 한 번에 등록" onClick={onOpenExcelModal} />
    </Dropdown>
  )
}

export default MaterialAddDropdown
