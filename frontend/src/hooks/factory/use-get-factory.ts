import { useState } from 'react'
import { FactoriesResponseModel } from '@/types/data-model'

// 페이지네이션 응답 타입
interface PaginatedResponseModel {
  count: number
  totalCnt: number
  pageCnt: number
  curPage: number
  nextPage: number | null
  previousPage: number | null
  data: FactoriesResponseModel[]
}

// 공장 설비 목록 조회
export const useGetFactoryList = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [factoryList, setFactoryList] = useState<PaginatedResponseModel | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getFactoryList = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/factory/factories`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const result: PaginatedResponseModel = await response.json()
        setFactoryList(result)
        return { success: true, data: result.data }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '공장 목록을 불러오지 못했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { getFactoryList, factoryList, isLoading, error }
}

// 공장 상세 조회
export const useGetFactory = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [factory, setFactory] = useState<FactoriesResponseModel | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getFactory = async (factoryId: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/factories/${factoryId}`,
        {
          method: 'GET',
          credentials: 'include',
        }
      )
      if (response.ok) {
        const result: FactoriesResponseModel = await response.json()
        setFactory(result)
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '공장 정보를 불러오지 못했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { getFactory, factory, isLoading, error }
}
