import { useState, useEffect, useCallback } from 'react'
import { ClientListResponseModel } from '@/types/data-model'
import useSearchClient from './use-search-client'
import useFactoryStore from '@/store/factory-store'

// 쿼리 파라미터 객체를 쿼리스트링으로 변환하는 함수
function toQueryString(params: Record<string, any>) {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(
      ([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`
    )
    .join('&')
}

const useGetClient = () => {
  const [clientList, setClientList] = useState<ClientListResponseModel | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchKeyword, setSearchKeyword] = useState<string>('')
  const [filters, setFilters] = useState<{
    name?: string
    business_registration_number?: string
    representative_name?: string
    client_type?: string
    page?: number
    page_size?: number
  }>({ page: 1, page_size: 10 })

  const { searchClients, isLoading: isSearchLoading, error: searchError } = useSearchClient()
  const factoryId = useFactoryStore((state) => state.factoryId)

  // 전체 목록 불러오기 (필터 포함)
  const getClientList = useCallback(
    async (customFilters?: typeof filters) => {
      if (!factoryId || isNaN(factoryId)) return // factoryId 없으면 호출하지 않음
      const params = {
        factory_id: factoryId,
        ...(customFilters || filters),
      }
      // page, page_size 방어
      if (!params.page || isNaN(params.page) || params.page < 1) params.page = 1
      if (!params.page_size || isNaN(params.page_size) || params.page_size < 1) params.page_size = 10
      const queryString = toQueryString(params)
      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/factory/client/clients?${queryString}`
      console.log('fetch url:', url)
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        })
        if (response.ok) {
          const result: ClientListResponseModel = await response.json()
          setClientList(result)
          return { success: true, data: result }
        } else {
          const errorData = await response.json()
          setError(errorData.detail || '거래처 목록을 불러오지 못했습니다.')
          setClientList(null)
          return { success: false, error: errorData.detail }
        }
      } catch {
        setError('서버 연결에 실패했습니다.')
        setClientList(null)
        return { success: false, error: '서버 연결에 실패했습니다.' }
      } finally {
        setIsLoading(false)
      }
    },
    [factoryId, filters]
  )

  // 검색어로 검색
  const searchAllFields = useCallback(
    async (value: string) => {
      if (!factoryId) return
      const searchResult = await searchClients({ factory_id: factoryId, q: value })
      if (searchResult.success && searchResult.data) {
        setClientList(searchResult.data)
      } else {
        setError(searchResult.error || '검색에 실패했습니다.')
        setClientList(null)
      }
    },
    [factoryId, searchClients]
  )

  // 검색어가 바뀔 때마다 자동으로 fetch
  useEffect(() => {
    if (!factoryId || isNaN(factoryId)) return // factoryId 없으면 아무것도 하지 않음
    if (searchKeyword) {
      searchAllFields(searchKeyword)
    } else {
      getClientList()
    }
  }, [searchKeyword, searchAllFields, getClientList, factoryId])

  return {
    clientList,
    isLoading: isLoading || isSearchLoading,
    error: error || searchError,
    searchKeyword,
    setSearchKeyword,
    refetch: () => (searchKeyword ? searchAllFields(searchKeyword) : getClientList()),
    setFilters, // 필터 setter도 export
    getClientList, // 필요시 외부에서 직접 호출 가능
  }
}

export default useGetClient
