import { CaretDown, CaretLineRightIcon } from '@phosphor-icons/react/dist/ssr'
import { useEffect, useState, useCallback } from 'react'
import MiniBtn from './mini-btn'
import IssueTypeDropdown from '../app/(with-layout)/tax/list/modals/create-tax-panel/issue-type-dropdown'

interface PanelProps {
  children: React.ReactNode
  title: string
  onClose: () => void
  hasSaveButton?: boolean
  // 세금계산서 생성 관련 props
  isCreateTax?: boolean
  // 발행 방식 드롭다운 관련 props
  isIssueTypeDropdownOpen?: boolean
  onIssueTypeDropdownOpen?: () => void
  onIssueTypeDropdownClose?: () => void
  onIssueTypeSelect?: (issueType: '청구' | '영수') => void
  // 세금계산서 임시보관함 관련 props
  isDraft?: boolean
  onIssueClick?: () => void
}

const Panel = ({
  children,
  title,
  onClose,
  hasSaveButton = false,
  isCreateTax = false,
  isIssueTypeDropdownOpen = false,
  onIssueTypeDropdownOpen,
  onIssueTypeDropdownClose,
  onIssueTypeSelect,
  isDraft = false,
  onIssueClick,
}: PanelProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(true)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 })

  const handleClose = useCallback(() => {
    setIsVisible(false)
    // 애니메이션이 끝난 후 DOM에서 제거
    setTimeout(() => {
      setShouldRender(false)
      onClose()
    }, 200) // duration-200과 맞춤
  }, [onClose])

  const handleDropdownOpen = () => {
    // 버튼 위치 계산
    const button = document.querySelector('[data-issue-type-button]') as HTMLElement
    if (button) {
      const rect = button.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right - 123, // 드롭다운 너비만큼 조정
      })
    }
    onIssueTypeDropdownOpen?.()
  }

  const handleDropdownClose = () => {
    onIssueTypeDropdownClose?.()
  }

  useEffect(() => {
    // 스크롤 막기
    const originalStyle = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // 애니메이션 시작
    requestAnimationFrame(() => {
      setIsVisible(true)
    })

    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [])

  useEffect(() => {
    // ESC 키 이벤트 리스너
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleClose])

  if (!shouldRender) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-bl/50 transition-opacity duration-200 z-40"
        role="button"
        tabIndex={0}
        onClick={handleClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleClose()
        }}
      />

      <div
        className={`fixed top-0 right-0 h-full transition-transform duration-200 ease-in-out z-40 ${
          isVisible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="w-[1000px] bg-white h-full flex flex-col px-10 pt-5">
          <div className="flex justify-between border-b border-lg pb-3">
            <div className="flex gap-2 items-center sticky top-0 bg-white z-10">
              <h3 className="Heading-3">{title}</h3>
              <button
                onClick={handleClose}
                className="flex items-center justify-center w-10 h-10 cursor-pointer hover:bg-bg rounded-lg transition-all duration-200"
              >
                <CaretLineRightIcon size={16} className="text-sv" />
              </button>
            </div>
            {hasSaveButton && (
              <MiniBtn
                text="저장"
                textColor="text-primary"
                bgColor="bg-primary-8"
                hoverColor="bg-secondary-hover"
              />
            )}

            {/* 세금계산서 내역 페이지의 세금계산서 생성 버튼 클릭 시 나오는 모달 */}
            {isCreateTax && (
              <div className="flex gap-2 relative">
                <MiniBtn
                  text="임시 저장"
                  textColor="text-primary"
                  bgColor="bg-primary-8"
                  hoverColor="hover:bg-secondary-hover"
                  onClick={() => {}}
                />
                <MiniBtn
                  text="발행 방식 선택"
                  textColor="text-wh"
                  bgColor="bg-primary"
                  hoverColor="hover:bg-primary-hover"
                  icon={CaretDown}
                  iconPosition="right"
                  onClick={handleDropdownOpen}
                  data-issue-type-button="true"
                />
                {isIssueTypeDropdownOpen && (
                  <IssueTypeDropdown
                    onClose={handleDropdownClose}
                    onSelect={onIssueTypeSelect || (() => {})}
                    position={dropdownPosition}
                  />
                )}
              </div>
            )}

            {isDraft && (
              <div className="flex gap-2 relative">
                <MiniBtn
                  text="수정"
                  textColor="text-dg"
                  borderColor="border-lg"
                  hoverColor="hover:bg-bg"
                />
                <MiniBtn
                  text="발행"
                  textColor="text-wh"
                  bgColor="bg-primary"
                  hoverColor="hover:bg-primary-hover"
                  onClick={() => {
                    handleClose()
                    onIssueClick?.()
                  }}
                />
              </div>
            )}
          </div>

          <div className="h-full overflow-y-auto scrollbar-hide pb-5 pt-6">{children}</div>
        </div>
      </div>
    </>
  )
}

export default Panel
