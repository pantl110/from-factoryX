import { useState } from 'react'

// 공장 삭제
export const useDeleteFactory = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteFactory = async (factoryId: number) => {
    setIsLoading(true)
    setError(null)

    // 쿠키에서 access 토큰 추출
    const cookies = document.cookie.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        acc[key] = value
        return acc
      },
      {} as Record<string, string>
    )
    const accessToken = cookies['access']

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/factory/factories`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify({
          factory_id: factoryId,
        }),
      })
      if (response.status === 204) {
        return { success: true }
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '공장 삭제에 실패했습니다.')
        return { success: false, error: errorData.detail }
      }
    } catch {
      setError('서버 연결에 실패했습니다.')
      return { success: false, error: '서버 연결에 실패했습니다.' }
    } finally {
      setIsLoading(false)
    }
  }

  return { deleteFactory, isLoading, error }
}
