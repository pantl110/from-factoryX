import { useState } from 'react'
import { EquipmentResponseModel } from '@/types/data-model'

const useGetEquipmentDetail = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getEquipmentDetail = async (factoryEqId: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment/${factoryEqId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )
      if (response.ok) {
        const result: EquipmentResponseModel = await response.json()
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '설비 정보를 불러오지 못했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { isLoading, error, getEquipmentDetail }
}

export default useGetEquipmentDetail
