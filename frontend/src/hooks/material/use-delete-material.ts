import { useState } from 'react'

const useDeleteMaterial = () => {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const deleteMaterial = async (materialId: number) => {
        setIsLoading(true)
        setError(null)
        setSuccess(false)
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material/${materialId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            })
            if (response.ok) {
                setSuccess(true)
                return { success: true }
            } else {
                const errorData = await response.json()
                setError(errorData.detail || '원자재 삭제에 실패했습니다.')
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
        deleteMaterial,
        isLoading,
        error,
        success,
    }
}

export default useDeleteMaterial 