import { useState } from 'react'
import { FactoriesResponseModel, FactoriesUpdateModel } from '@/types/data-model'

// 공장 정보 수정
export const useUpdateFactory = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFactory = async (data: FactoriesUpdateModel) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/factory/factories`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (response.ok) {
        const result: FactoriesResponseModel = await response.json()
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '공장 정보 수정에 실패했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { updateFactory, isLoading, error }
}
