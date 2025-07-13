import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import { useForm } from 'react-hook-form'
import { CompanyFormDataModel } from './types'
import useToast from '@/hooks/use-toast'
import Toast from '@/ui/toast'
import { CheckCircle } from '@phosphor-icons/react'
import { formatBusinessNumber, formatPhoneNumber, formatFaxNumber } from '@/hooks/format-number'

const CompanyInfo = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000)

  const { register, handleSubmit } = useForm<CompanyFormDataModel>({
    defaultValues: {
      companyName: '',
      businessNumber: '',
      ceoName: '',
      managerEmail: '',
      managerPhone: '',
      managerFax: '',
      businessType: '',
      businessCategory: '',
      address: '',
    },
  })

  const onSubmit = () => {
    // console.log("회사 정보:", data);
    showToast()
  }

  return (
    <>
      <div className="flex flex-col py-8 gap-4 border-b border-b-[#eeeeee]">
        <h3 className="Heading-3">회사 정보</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="회사명을 입력하세요."
              label="회사명"
              required
              {...register('companyName')}
            />
            <Input
              label="사업자등록번호"
              placeholder="사업자등록번호를 입력하세요."
              required
              {...register('businessNumber', {
                onChange: (e) => {
                  const formatted = formatBusinessNumber(e.target.value)
                  e.target.value = formatted
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input placeholder="대표자명을 입력하세요." label="대표자명" {...register('ceoName')} />
            <Input
              placeholder="이메일을 입력하세요."
              label="이메일"
              {...register('managerEmail')}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="연락처를 입력하세요."
              label="연락처"
              {...register('managerPhone', {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  e.target.value = formatted
                },
              })}
            />
            <Input
              placeholder="팩스 번호를 입력하세요."
              label="팩스 번호"
              {...register('managerFax', {
                onChange: (e) => {
                  const formatted = formatFaxNumber(e.target.value)
                  e.target.value = formatted
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input placeholder="업태를 입력하세요." label="업태" {...register('businessType')} />
            <Input
              placeholder="종목을 입력하세요."
              label="종목"
              {...register('businessCategory')}
            />
          </div>
          <Input
            placeholder="사업장 주소를 입력하세요."
            label="사업장 주소"
            {...register('address')}
          />
          <div className="flex justify-end">
            <MiniBtn
              text="저장"
              textColor="text-primary"
              bgColor="bg-primary-8"
              hoverColor="hover:bg-secondary-hover"
              type="submit"
            />
          </div>
        </form>
      </div>

      {/* 토스트 */}
      {isToastOpen && (
        <Toast
          icon={<CheckCircle size={24} className="text-primary" />}
          text="저장이 완료되었어요."
          subtext="입력하신 회사 정보가 업데이트되었어요."
          type="primary"
          isVisible={isVisible}
        />
      )}
    </>
  )
}

export default CompanyInfo
