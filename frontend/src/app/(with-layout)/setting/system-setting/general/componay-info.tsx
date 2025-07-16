import Input from '@/ui/input'
import MiniBtn from '@/ui/mini-btn'
import { useForm } from 'react-hook-form'
import { FactoriesModel } from '@/types/data-model'
import {
  useToast,
  useGetFactory,
  useUpdateFactory,
  formatBusinessNumber,
  formatPhoneNumber,
  formatFaxNumber,
} from '@/hooks'
import Toast from '@/ui/toast'
import { CheckCircle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import useFactoryStore from '@/store/factory-store'

const CompanyInfo = () => {
  const { isToastOpen, isVisible, showToast } = useToast(2000)
  const factoryId = useFactoryStore((state) => state.factoryId)
  const { getFactory, factory, error: _factoryError } = useGetFactory()
  const { updateFactory } = useUpdateFactory()

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

  useEffect(() => {
    if (factoryId) {
      getFactory(factoryId)
    }
    // getFactory는 의존성 배열에서 제거!
  }, [factoryId])

  useEffect(() => {
    if (factory) {
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
  }, [factory, setValue])

  const [isProcessing, setIsProcessing] = useState(false)

  const onSubmit = async (data: FactoriesModel) => {
    if (isProcessing || !factoryId || !factory) return
    setIsProcessing(true)

    try {
      if (!data.name || data.name.trim() === '') {
        setError('name', { type: 'manual', message: '회사명을 입력해주세요.' })
        setIsProcessing(false)
        return
      } else {
        clearErrors('name')
      }

      // 기존 공장 수정
      const updateData = {
        factory_id: factoryId,
        name: data.name || '',
        business_registration_number: data.business_registration_number || '',
        representative_name: data.representative_name || '',
        manager_email: data.manager_email || '',
        manager_phone: data.manager_phone || '',
        manager_fax: data.manager_fax || '',
        business_type: data.business_type || '',
        business_category: data.business_category || '',
        business_address: data.business_address || '',
        is_trial: factory.is_trial,
        billing_key: factory.billing_key,
      }
      const result = await updateFactory(updateData)
      if (result && result.success) {
        showToast()
        // 수정 후 최신 factory 정보로 폼 동기화
        await getFactory(factoryId)
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
              showError={!!errors.business_registration_number}
              {...register('business_registration_number', {
                onChange: (e) => {
                  const formatted = formatBusinessNumber(e.target.value)
                  e.target.value = formatted
                },
                pattern: {
                  value: /^\d{3}-\d{2}-\d{5}$/,
                  message: '',
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
              showError={!!errors.manager_email}
              {...register('manager_email', {
                pattern: {
                  value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                  message: '',
                },
              })}
            />
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="연락처를 입력하세요."
              label="연락처"
              showError={!!errors.manager_phone}
              {...register('manager_phone', {
                onChange: (e) => {
                  const formatted = formatPhoneNumber(e.target.value)
                  e.target.value = formatted
                },
                pattern: {
                  value: /^(01[016789]-\d{3,4}-\d{4}|0\d{1,2}-\d{3,4}-\d{4})$/,
                  message: '',
                },
              })}
            />
            <Input
              placeholder="팩스 번호를 입력하세요."
              label="팩스 번호"
              showError={!!errors.manager_fax}
              {...register('manager_fax', {
                onChange: (e) => {
                  const formatted = formatFaxNumber(e.target.value)
                  e.target.value = formatted
                },
                pattern: {
                  value: /^(0\d{1,3}-\d{3,4}-\d{4})$/,
                  message: '',
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
