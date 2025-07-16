import { useState } from 'react'
import { EquipmentModel, EquipmentResponseModel } from '@/types/data-model'

const useCreateEquipment = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createEquipment = async (data: EquipmentModel) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/factory/equipment`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (response.status === 201) {
        const result: EquipmentResponseModel = await response.json()
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '설비 등록에 실패했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { createEquipment, isLoading, error }
}

export default useCreateEquipment
