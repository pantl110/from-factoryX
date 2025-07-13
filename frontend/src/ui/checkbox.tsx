import { Square, Check } from '@phosphor-icons/react'

interface CheckboxProps {
  isChecked: boolean
  onToggle: () => void
}

const Checkbox = ({ isChecked, onToggle }: CheckboxProps) => {
  return (
    <div
      className="flex items-center justify-center w-9 h-full"
      onClick={(e) => {
        e.stopPropagation()
      }}
    >
      <div className="w-5 h-5 relative">
        <Square
          size={20}
          className={`cursor-pointer ${isChecked ? 'text-primary' : 'text-sv'}`}
          onClick={onToggle}
        />
        {isChecked && (
          <Check
            size={12}
            weight="bold"
            className="cursor-pointer z-10 text-primary absolute top-[3.8px] left-[3.8px]"
            onClick={onToggle}
          />
        )}
      </div>
    </div>
  )
}

export default Checkbox
