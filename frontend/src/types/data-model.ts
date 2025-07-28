// 데이터 모델

// 공통
export interface PaginationModel {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
}

// Users API
// 이메일 인증 코드 발송
export interface SendVerificationCodeModel {
  email: string;
  verification_type: string;
}

export interface EmailVerificationResponseModel {
  success: boolean;
  message?: string;
  expires_at?: string;
}

// 이메일 인증 코드 확인
export interface VerifyCodeModel {
  email: string;
  code: string;
  verification_type: string;
}

// 비밀번호 재설정
export interface ResetPasswordModel {
  email: string;
  code: string;
  new_password: string;
  new_password_confirm: string;
}

// 회원가입
export interface SignupFormDataModel {
  email: string; // required, string (Email)
  password: string; // required, string (Password)
  password_confirm: string; // required, string (Password Confirm)
  terms_of_service: boolean; // required, boolean (Terms Of Service)
  privacy_policy_agreement: boolean; // required, boolean (Privacy Policy Agreement)
  marketing_agreement: boolean; // boolean (Marketing Agreement), Default: false
}

export interface SignupResponseModel {
  email: string;
  status: string;
}

// 로그인
export interface LoginFormDataModel {
  email: string;
  password: string;
}

export interface LoginResponseModel {
  email: string;
  status: string;
}

// 로그아웃
export interface LogoutResponseModel {
  detail: string;
}

// 내 정보 조회
export interface UserInfoModel {
  email: string;
  status: string;
  username?: string | null;
  phone_number?: string | null;
  profile_image?: string | null;
}

// 회원 정보 수정
export interface UpdateUserInfoModel {
  username?: string;
  phone_number?: string | null;
  profile_image?: string | null;
}

//////////////////////
// Factory API
// 공장 등록
export interface FactoriesModel {
  name: string;
  business_registration_number?: string;
  representative_name?: string;
  manager_email?: string;
  manager_phone?: string;
  manager_fax?: string;
  business_type?: string;
  business_category?: string;
  business_address?: string;
  is_trial?: boolean;
  billing_key?: string;
}

export interface FactoriesResponseModel {
  id: number;
  created_at: string;
  updated_at: string;
  owner: number;
  name: string;
  business_registration_number: string;
  representative_name: string;
  manager_email: string;
  manager_phone: string;
  manager_fax: string;
  business_type: string;
  business_category: string;
  business_address: string;
  is_trial: boolean;
  billing_key: string;
}

// 공장 목록 조회
export interface FactoriesListResponseModel extends PaginationModel {
  data: FactoriesResponseModel[];
}

// 공장 수정
export interface FactoriesUpdateModel {
  factory_id: number;
  name: string;
  business_registration_number: string;
  representative_name: string;
  manager_email: string;
  manager_phone: string;
  manager_fax: string;
  business_type: string;
  business_category: string;
  business_address: string;
  is_trial: boolean;
  billing_key: string;
}

//////////////////////
// Factory Equipment API
// 설비 등록
export interface EquipmentModel {
  factory: number;
  name: string;
  status?: EquipmentStatusType;
  priority: number;
  location?: string;
  note?: string;
}

export interface EquipmentResponseModel {
  id: number;
  created_at: string;
  updated_at: string;
  factory: number;
  name: string;
  status?: EquipmentStatusType;
  priority: number;
  location?: string;
  note?: string;
}

// 설비 목록 조회
export interface EquipmentListResponseModel extends PaginationModel {
  data: EquipmentResponseModel[];
}

//////////////////////
// Factory Client API
// 거래체 등록
export interface ClientModel {
  factory_id: number;
  // type?: ClientType;
  name: string;
  business_registration_number?: string;
  representative_name?: string;
  email?: string;
  phone?: string;
  fax?: string;
  business_type?: string;
  business_category?: string;
  address?: string;
  manager?: string;
  note?: string;
}

export interface ClientResponseModel {
  id: number;
  // client_type?: ClientType;
  name: string;
  business_registration_number?: string;
  representative_name?: string;
  business_type?: string;
  business_category?: string;
  phone?: string;
  email?: string;
  note?: string;
  address?: string;
  manager?: string;
  fax?: string;
  created_at?: string;
  updated_at?: string;
}

// 거래처 목록 조회
export interface ClientListResponseModel extends PaginationModel {
  data: ClientResponseModel[];
}

// 거래체 수정
export interface ClientUpdateModel {
  client_id: number;
  factory_id: number;
  // client_type?: ClientType;
  name: string;
  business_registration_number?: string;
  representative_name?: string;
  email?: string;
  phone?: string;
  fax?: string;
  business_type?: string;
  business_category?: string;
  address?: string;
  note?: string;
}

//////////////////////
// Product API
// 제품 등록
export interface ProductModel {
  factory: number;
  name: string;
  code: string;
  unit: string;
  spec: string;
  current_stock?: number | null;
  average_production_time?: number;
  buffer_rate?: number; // 기본값 10%
  location?: string;
  note?: string;
}

export interface ProductResponseModel {
  id: number;
  created_at: string;
  updated_at: string;
  factory: number;
  name: string;
  code: string;
  unit: string;
  spec: string;
  current_stock?: number;
  average_production_time?: number;
  buffer_rate?: number;
  location?: number;
  note?: string;
}

// 제품 목록 조회
export interface ProductListResponseModel extends PaginationModel {
  data: ProductResponseModel[];
}
//////////////////////
// Product History API
export interface ProductHistoryModel {
  product: number;
  type: 'in' | 'out'; // 입고 또는 출고
  quantity: number; // 재고 변동 수량
  total_stock?: number; // 재고 변동 후 재고 수량
}

export interface ProductHistoryResponseModel {
  id: number;
  created_at: string;
  updated_at: string;
  type: 'in' | 'out'; // 입고 또는 출고
  product: number;
  quantity: number;
  total_stock?: number; // 재고 변동 후 재고 수량
}

export interface ProductHistoryListResponseModel extends PaginationModel {
  data: ProductHistoryResponseModel[];
}

//////////////////////
// Material API
// 원자재 등록
export interface MaterialModel {
  factory_id?: number;
  name: string;
  code: string;
  unit: string;
  spec: string;
  standard_stock?: number;
  location?: number;
}

export interface MaterialResponseModel {
  id: number;
  created_at: string;
  updated_at: string;
  factory: number;
  name: string;
  code: string;
  unit: string;
  spec: string;
  current_stock?: number;
  standard_stock?: number;
  location?: number;
}

// 원자재 목록 조회
export interface MaterialListResponseModel extends PaginationModel {
  data: MaterialResponseModel[];
}

// Material History API
export interface MaterialItemModel {
  name: string;
  code: string;
  spec: string; // 규격
  unit: string; // 단위
  quantity: number;
  price: number;
}

export interface MaterialHistoryModel {
  factory: number;
  client_info: ClientModel;
  materials: MaterialItemModel[];
}

export interface MaterialHistoryResponseModel {
  id: number;
  type: string;
  material_id: number;
  client_id: number;
  quantity: number;
  price: number;
  total_stock: number;
}

// 원자재 히스토리 조회
export interface MaterialHistoryListResponseModel extends PaginationModel {
  data: MaterialHistoryResponseModel[];
}

//////////////////////
// Material Product API
export interface CreateMaterialProductModel {
  type: 'material' | 'product'; // 연결 타입 (material: 원자재 기준, product: 제품 기준)
  target_id: number; // 기준이 되는 ID (type이 material이면 Material ID, type이 product이면 Product ID)
  connections: Array<{ id: number; quantity: number }>;
  // - id: 연결할 ID (type이 material이면 Product ID, type이 product이면 Material ID)
  // - quantity: 제품 1개 생산에 필요한 원자재 수량
}

export interface MaterialProductConnectionModel {
  id: number;
  product_id: number;
  material_id: number;
  quantity: number; // 제품 1개 생산에 필요한 원자재 수량
  product_name: string;
  material_name: string;
}

export interface MaterialProductConnectionResponseModel {
  message: string;
  created_connections: MaterialProductConnectionModel[]; // 생성된 연결 목록
  total_count: number; // 생성된 총 연결 수
}

//////////////////////
// Location API
export interface LocationModel {
  id: number; // product id/material id
  // response 일때는 location_id
  type: 'material' | 'product';
  location?: string;
  images?: string[];
}

export interface LocationListResponseModel {
  locations: LocationModel[];
}

export interface UpdateLocationModel {
  type: 'material' | 'product';
  location?: string;
  images?: string[];
}

////////////////////////////
// Project API
// 프로젝트 생성 + 견적서 생성
// export interface CreateProjectModel {
//   status?: string;
//   transact_date?: string;
//   factory_id: number;
//   client_id: number;
//   due_date: string;
//   uploaded_file?: string;
//   products?: ProductResponseModel[];
// }

// export interface CreateProjectResponseModel {
//   id: number;
//   status?: string;
//   transact_date?: string;
//   tax_invoice?: number;
//   created_at: string;
//   updated_at: string;
// }

// 프로젝트 정보 수정
export interface ProjectUpdateModel {
  status: string;
  transact_date: string;
  tax_invoice_id: number;
}

// 프로젝트 조회 요청
// 진행 중인 프로젝트: status="progress"
// 완료된 프로젝트: status="complete"
export interface ProjectResponseModel {
  project_id: number;
  client_name: string;
  product_names: string[];
  start_date: string;
  due_date: string;
  publish_status: TaxStatusType; // 세금계산서 발행 상태
  status: ProjectStatusType; // 프로젝트 상태
}

export interface ProjectListResponseModel extends PaginationModel {
  data: ProjectResponseModel[];
}

//////////////////////
//// Quotation API
//// OCR API
export interface OcrDataModel {
  client_data: ClientModel;
}

//////////////////////
// Project Log API
export interface ProjectLogModel {
  type: string;
  title: string;
  content: string;
}

export interface ProjectLogResponseModel {
  id: number;
  project_id: number;
  type: string;
  title: string;
  content: string;
  // created_at?: string;
  // updated_at?: string;
}

export interface ProjectLogListResponseModel extends PaginationModel {
  data: ProjectLogResponseModel[];
}

//////////////////////
// Project Plan API
// 생산 계획 생성
export interface CreateProjectPlanModel {
  project_id: number;
  quotation_product_ids: number[];
  production_quantities: number[];
  equipment_ids: number[];
  start_dates: string[];
  end_dates: string[];
  avg_production_times: number[];
}

export interface ProjectPlanResponseModel {
  id: number;
  project_id: number;
  quotation_product_id: number;
  equipment_id: number;
  status: string;
  quantity: number;
  start_date: string;
  end_date: string;
  avg_production_time: number;
}

// 생산 계획 조회
export interface ProductForPlanModel {
  id: number;
  name: string;
  code: string;
  unit: string;
  spec: string;
}

export interface QuotationProductForPlanModel {
  id: number;
  product: ProductForPlanModel;
  quantity: number;
  unit_price: number;
}

export interface EquipmentForPlanModel {
  id: number;
  name: string;
  priority: number;
}

export interface ProjectPlanModel {
  id: number;
  project_id: number;
  quotation_product: QuotationProductForPlanModel;
  equipment: EquipmentForPlanModel;
  status: string;
  quantity: number;
  start_date: string;
  end_date: string;
  avg_production_time: number;
}

export interface ProjectPlanListResponseModel extends PaginationModel {
  data: ProjectPlanModel[];
}

// 생산 계획 정보 수정
export interface UpdateProjectPlanModel {
  equipment_id?: number;
  quantity?: number;
  status?: string;
  start_date?: string;
  end_date?: string;
  avg_production_time?: number;
}

//////////////////////
// Factory Member API
// 멤버 초대
export interface InviteMemberModel {
  factory_id: number;
  email: string;
  role: string;
}

export interface InviteMemberResponseModel {
  email: string;
  role: string;
  invited_by: number;
  invited_at: string;
}

// 멤버 조회
export interface MemberResponseModel {
  id: number;
  factory: number;
  user?: number; // 가입된 초대자의 user_id, 미가입 초대자는 none
  name?: string; // 사용자의 이름, 미가입 초대자는 ""
  email: string;
  role: MemberRoleType;
  status: MemberStatusType;
  invited_at: string;
}

export interface MemberListResponseModel extends PaginationModel {
  data: MemberResponseModel[];
}

// 멤버 수정
export interface UpdateMemberResponseModel {
  id: number;
  factory_id: number;
  user_id: number;
  role: MemberRoleType;
  status: MemberStatusType;
  invited_by_id: number;
  created_at: string;
  updated_at: string;
}

///////////////////////////////////////////
// 여기는 목데이터 데이터 모델!!! 나중에 지우기!
// export interface MaterialModel {
//   id: number;
//   materialName: string;
//   usageQuantity: string;
// }

// export interface ProductDataModel {
//   id: number | null;
//   productName: string;
//   productCode?: string;
//   size: string;
//   unit: string;
//   stock?: number;
//   productionTime?: string;
//   location?: string;
//   comment?: string[];
//   returnQuantity?: number;
//   [key: string]: unknown;
// }

// export interface MaterialDataModel {
//   id: string;
//   materialName: string;
//   size: string;
//   usageQuantity?: number | null;
//   unitPrice?: number | null;
//   unit?: string;
//   [key: string]: unknown;
// }

import {
  MemberRoleType,
  MemberStatusType,
  ProjectStatusType,
  TaxStatusType,
  EquipmentStatusType,
} from './status-type';

export type {
  MemberRoleType,
  MemberStatusType,
  ProjectStatusType,
  TaxStatusType,
} from './status-type';
