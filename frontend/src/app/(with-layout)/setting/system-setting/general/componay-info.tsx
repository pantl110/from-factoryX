import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import { useForm } from 'react-hook-form'
import { FactoriesModel } from '@/types/data-model'
import {
  useToast,
  useGetFactoryList,
  useUpdateFactory,
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
} from '@/hooks'
import Toast from '@/ui/toast'
import { CheckCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'

const CompanyInfo = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000)

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FactoriesModel>({
    defaultValues: {
      name: '',
      business_registration_number: '',
      representative_name: '',
      manager_email: '',
      manager_phone: '',
      manager_fax: '',
      business_type: '',
      business_category: '',
      business_address: '',
    },
  })

  const { getFactoryList, factoryList } = useGetFactoryList()
  const { updateFactory } = useUpdateFactory()

  useEffect(() => {
    // user의 공장 리스트 가져오기
    getFactoryList()
  }, [getFactoryList])

  useEffect(() => {
    if (factoryList?.data && factoryList.data.length > 0) {
      const factory = factoryList.data[0] // 첫번째 공장 정보 가져오기

      setValue('name', factory.name || '')
      setValue('business_registration_number', factory.business_registration_number || '')
      setValue('representative_name', factory.representative_name || '')
      setValue('manager_email', factory.manager_email || '')
      setValue('manager_phone', factory.manager_phone || '')
      setValue('manager_fax', factory.manager_fax || '')
      setValue('business_type', factory.business_type || '')
      setValue('business_category', factory.business_category || '')
      setValue('business_address', factory.business_address || '')
    }
  }, [factoryList, setValue])

  const [isProcessing, setIsProcessing] = useState(false)

  const onSubmit = async (data: FactoriesModel) => {
    if (isProcessing) return // 중복 실행 방지
    setIsProcessing(true)

    try {
      if (!data.name || data.name.trim() === '') {
        setError('name', { type: 'manual', message: '회사명을 입력해주세요.' })
        setIsProcessing(false)
        return
      } else {
        clearErrors('name')
      }

      // 항상 최신 factoryList를 받아온다
      const listResult = await getFactoryList()
      const latestList =
        listResult && listResult.success && Array.isArray(listResult.data) ? listResult.data : []

      if (latestList.length === 0) {
        // 공장이 없는 경우 (이론상 발생하지 않음, 회원가입 시 생성되게 함)
        setError('name', {
          type: 'manual',
          message: '공장 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.',
        })
        return
      }

      // 기존 공장 수정
      const updateData = {
        factory_id: latestList[0]?.id,
        name: data.name || '',
        business_registration_number: data.business_registration_number || '',
        representative_name: data.representative_name || '',
        manager_email: data.manager_email || '',
        manager_phone: data.manager_phone || '',
        manager_fax: data.manager_fax || '',
        business_type: data.business_type || '',
        business_category: data.business_category || '',
        business_address: data.business_address || '',
        is_trial: latestList[0]?.is_trial,
        billing_key: latestList[0]?.billing_key,
      }

      const result = await updateFactory(updateData)
      if (result && result.success) {
        showToast()
        // 수정 후 최신 리스트로 폼 동기화
        const refresh = await getFactoryList()
        if (refresh && refresh.success && Array.isArray(refresh.data) && refresh.data.length > 0) {
          const factory = refresh.data[0]
          setValue('name', factory.name || '')
          setValue('business_registration_number', factory.business_registration_number || '')
          setValue('representative_name', factory.representative_name || '')
          setValue('manager_email', factory.manager_email || '')
          setValue('manager_phone', factory.manager_phone || '')
          setValue('manager_fax', factory.manager_fax || '')
          setValue('business_type', factory.business_type || '')
          setValue('business_category', factory.business_category || '')
          setValue('business_address', factory.business_address || '')
        }
      } else if (result && result.error) {
        setError('name', { type: 'manual', message: result.error })
      }
    } finally {
      setIsProcessing(false)
    }
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
              {...register('name')}
              showError={!!errors.name}
            />
            <Input
              label="사업자등록번호"
              placeholder="사업자등록번호를 입력하세요."
              required
              {...register('business_registration_number', {
                onChange: (e) => {
                  const formatted = formatBusinessNumber(e.target.value)
                  e.target.value = formatted
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="대표자명을 입력하세요."
              label="대표자명"
              required
              {...register('representative_name')}
            />
            <Input
              placeholder="이메일을 입력하세요."
              label="이메일"
              required
              {...register('manager_email')}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="연락처를 입력하세요."
              label="연락처"
              {...register('manager_phone', {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  e.target.value = formatted
                },
              })}
            />
            <Input
              placeholder="팩스 번호를 입력하세요."
              label="팩스 번호"
              {...register('manager_fax', {
                onChange: (e) => {
                  const formatted = formatFaxNumber(e.target.value)
                  e.target.value = formatted
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input placeholder="업태를 입력하세요." label="업태" {...register('business_type')} />
            <Input
              placeholder="종목을 입력하세요."
              label="종목"
              {...register('business_category')}
            />
          </div>
          <Input
            placeholder="사업장 주소를 입력하세요."
            label="사업장 주소"
            {...register('business_address')}
          />
          <div className="flex justify-end">
            <MiniBtn
              text="저장"
              textColor="text-primary"
              bgColor="bg-primary-8"
              hoverColor="hover:bg-secondary-hover"
              type="submit"
              disabled={isProcessing}
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
