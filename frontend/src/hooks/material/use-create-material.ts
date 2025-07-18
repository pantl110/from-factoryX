// import { useState } from 'react'
// import { MaterialModel, MaterialResponseModel } from '@/types/data-model'

// const useCreateMaterial = () => {
//     const [isLoading, setIsLoading] = useState(false)
//     const [error, setError] = useState<string | null>(null)
//     const [success, setSuccess] = useState(false)
//     const [createdMaterial, setCreatedMaterial] = useState<MaterialResponseModel | null>(null)

//     const createMaterial = async (data: MaterialModel) => {
//         setIsLoading(true)
//         setError(null)
//         setSuccess(false)
//         try {
//             const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/v1/stock/material`, {
//                 method: 'POST',
//                 credentials: 'include',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify(data),
//             })
//             if (response.ok) {
//                 const result: MaterialResponseModel = await response.json()
//                 setCreatedMaterial(result)
//                 setSuccess(true)
//                 return { success: true, data: result }
//             } else {
//                 const errorData = await response.json()
//                 setError(errorData.detail || '원자재 등록에 실패했습니다.')
//                 return { success: false, error: errorData.detail }
//             }
//         } catch {
//             setError('서버 연결에 실패했습니다.')
//             return { success: false, error: '서버 연결에 실패했습니다.' }
//         } finally {
//             setIsLoading(false)
//         }
//     }

//     return {
//         createMaterial,
//         createdMaterial,
//         isLoading,
//         error,
//         success,
//     }
// }

// export default useCreateMaterial 