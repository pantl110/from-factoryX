import { useState } from 'react'
import { ProductResponseModel, ProductListResponseModel, PaginationModel } from '@/types/data-model'

interface ProductFilterModel {
  name?: string | null
  page?: number
  page_size?: number
}

const useGetProduct = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [product, setProduct] = useState<ProductResponseModel | null>(null)
  const [productList, setProductList] = useState<ProductResponseModel[]>([])
  const [pagination, setPagination] = useState<PaginationModel | null>(null)

  const getProductList = async (filters: ProductFilterModel) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.name) params.append('name', filters.name)
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.page_size) params.append('page_size', filters.page_size.toString())

      const url = `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product?${params}`
      const headers = {
        'Content-Type': 'application/json',
      }
      console.log('GET ProductList URL:', url)
      console.log('GET ProductList headers:', headers)
      console.log('GET ProductList params:', params.toString())

      const response = await fetch(
        url,
        {
          method: 'GET',
          credentials: 'include',
          headers,
        }
      )

      if (response.ok) {
        const result: ProductListResponseModel = await response.json()
        const products = result.data || []
        setProductList(products)
        // result는 ProductListResponseModel이므로 PaginationModel로 타입 단언
        setPagination(result as PaginationModel)
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '품목 목록을 불러오지 못했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  const getProductDetail = async (productId: number) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/${productId}`,
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        const result: ProductResponseModel = await response.json()
        setProduct(result)
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '품목 상세 정보를 불러오지 못했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    getProductList,
    getProductDetail,
    product,
    productList,
    pagination,
    isLoading,
    error,
  }
}

export default useGetProduct
