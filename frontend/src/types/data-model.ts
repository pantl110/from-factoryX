// 데이터 모델

// Users API
// 이메일 인증 코드 발송
export interface SendVerificationCodeModel {
  email: string
  verification_type: string
}

export interface EmailVerificationResponseModel {
  success: boolean
  message?: string
  expires_at?: string
}

// 이메일 인증 코드 확인
export interface VerifyCodeModel {
  email: string
  code: string
  verification_type: string
}

// 비밀번호 재설정
export interface ResetPasswordModel {
  email: string
  code: string
  new_password: string
  new_password_confirm: string
}

// 회원가입
export interface SignupFormDataModel {
  email: string // required, string (Email)
  password: string // required, string (Password)
  password_confirm: string // required, string (Password Confirm)
  terms_of_service: boolean // required, boolean (Terms Of Service)
  privacy_policy_agreement: boolean // required, boolean (Privacy Policy Agreement)
  marketing_agreement: boolean // boolean (Marketing Agreement), Default: false
}

export interface SignupResponseModel {
  email: string
  status: string
}

// 로그인
export interface LoginFormDataModel {
  email: string
  password: string
}

export interface LoginResponseModel {
  email: string
  status: string
}

// 로그아웃
export interface LogoutResponseModel {
  detail: string
}

// 내 정보 조회
export interface UserInfoModel {
  email: string
  status: string
  username?: string | null
  phone_number?: string | null
  profile_image?: string | null
}

// 회원 정보 수정
export interface UpdateUserInfoModel {
  username?: string
  phone_number?: string | null
  profile_image?: string | null
}

//////////////////////
// Factory API
// 공장 등록
export interface FactoriesModel {
  name: string
  business_registration_number?: string
  representative_name?: string
  manager_email?: string
  manager_phone?: string
  manager_fax?: string
  business_type?: string
  business_category?: string
  business_address?: string
  is_trial?: boolean
  billing_key?: string
}

export interface FactoriesResponseModel {
  id: number
  created_at: string
  updated_at: string
  owner: number
  name: string
  business_registration_number: string
  representative_name: string
  manager_email: string
  manager_phone: string
  manager_fax: string
  business_type: string
  business_category: string
  business_address: string
  is_trial: boolean
  billing_key: string
}

// 공장 수정
export interface FactoriesUpdateModel {
  factory_id: number
  name: string
  business_registration_number: string
  representative_name: string
  manager_email: string
  manager_phone: string
  manager_fax: string
  business_type: string
  business_category: string
  business_address: string
  is_trial: boolean
  billing_key: string
}

//////////////////////

//////////////////////
// API 응답 모델
export interface ApiPaginationInfoModel {
  current_page: number
  total_pages: number
  total_count: number
  page_size: number
}

export interface ApiResponseModel<T> {
  success: boolean
  data: T
  message?: string
  pagination?: ApiPaginationInfoModel
}

// 팩토리 API 응답 타입
export type FactoryApiResponseType<T> = ApiResponseModel<T>

//////////////////////

// 여기는 목데이터 데이터 모델!!! 나중에 지우기!
export interface MaterialModel {
  id: number
  materialName: string
  usageQuantity: string
}

export interface ProductDataModel {
  id: number | null
  productName: string
  productCode?: string
  size: string
  unit: string
  stock?: number
  productionTime?: string
  location?: string
  comment?: string[]
  returnQuantity?: number
  [key: string]: unknown
}

export interface MaterialDataModel {
  id: string
  materialName: string
  size: string
  usageQuantity?: number | null
  unitPrice?: number | null
  unit?: string
  [key: string]: unknown
}

import { ClientType } from '@/app/(with-layout)/setting/master-data/client/types'
export interface ClientDataModel {
  id: string
  type: ClientType
  companyName: string
  businessNumber: string
  representativeName: string
  dueDate: string
  businessType?: string // 업태
  businessCategory?: string // 종목
  companyAddress: string
  responsibleName: string
  email: string
  contact?: string
  fax?: string
  deliveryAddress?: string
  comment?: string
  [key: string]: unknown
}
