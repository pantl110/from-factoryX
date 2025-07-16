import { useState } from 'react'
import { ClientDetailModel, ClientDetailResponseModel } from '@/types/data-model'

const useGetClientDetail = () => {
  const [clientDetail, setClientDetail] = useState<ClientDetailResponseModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getClientDetail = async (data: ClientDetailModel) => {
    if (
      typeof data.client_id !== 'number' ||
      !Number.isInteger(data.client_id) ||
      data.client_id <= 0
    ) {
      setError('유효하지 않은 client_id')
      return { success: false, error: '유효하지 않은 client_id' }
    }
    setIsLoading(true)
    setError(null)
    setClientDetail(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client/clients/${data.client_id}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )
      if (response.ok) {
        const result: ClientDetailResponseModel = await response.json()
        setClientDetail(result)
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '거래처 상세 정보를 불러오지 못했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { getClientDetail, clientDetail, isLoading, error }
}

export default useGetClientDetail
