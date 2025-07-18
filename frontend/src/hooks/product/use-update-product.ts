import { useState } from 'react'
import { ProductResponseModel, ProductModel } from '@/types/data-model'

const useUpdateProduct = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateProduct = async (productId: number, data: Partial<ProductModel>) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/v1/stock/product/${productId}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (response.ok) {
        const result: ProductResponseModel = await response.json()
        return { success: true, data: result }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '품목 수정에 실패했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch (error) {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { updateProduct, isLoading, error }
}

export default useUpdateProduct
