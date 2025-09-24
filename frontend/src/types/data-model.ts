// 데이터 모델

// 공통
export interface PaginationModel {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage?: number | null;
  previousPage?: number | null;
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
  member_id: number;
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
  id: number; // factory_id
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
  inviting: InviteMemberResponseModel[];
  created_at: string;
  updated_at: string;
  invited_at: string;
  role?: string;
  invited_by: number;
  member: MemberResponseModel;
  members: MemberResponseModel[];
  trial_end_date: string;
  subscription_histories: SubscriptionHistoryResponseModel[];
}

// 공장 수정
export interface FactoriesUpdateModel {
  factory_id: number;
  name: string;
  business_registration_number: string;
  representative_name: string;
  manager_email?: string;
  manager_phone?: string;
  manager_fax?: string;
  business_type: string;
  business_category: string;
  business_address?: string;
  is_trial?: boolean;
  billing_key?: string;
}

//////////////////////
// 구독 관련 api
export interface SubscriptionResponseModel {
  id: number;
  created_at: string;
  updated_at: string;
  type: SubscriptionStatusType;
  price: number;
  tax_invoice_count: number;
}

export interface SubscriptionHistoryResponseModel {
  id: number;
  subscription: SubscriptionResponseModel;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  billing_key: string; // 어떤 카드인지
  customer_key: string; // 누구의 카드인지
  is_canceled: boolean;
}

export interface PaymentResponseModel {
  id: number; // 결제 아이디
  subscription_history: SubscriptionHistoryResponseModel;
  payment_key: string; // 토스페이먼츠 결제 키
  order_id: string; // // 주문 ID (가맹점에서 생성한 주문 식별자)
  amount: number; // 결제 금액
  status: PaymentStatusType; // 결제 상태
  method: string; // 카드 정보
  approved_at: string | null; // 결제 승인 시간 (ISO 8601 형식, null이면 미승인)
  failure_code: string | null;
  failure_message: string | null;
  card_company: string | null;
  card_number: string | null;
  card_type: string | null;
  card_owner_type: string | null;
  created_at: string; // 결제 요청 생성 시간 (ISO 8601 형식)
  updated_at: string;
}

export interface PaymentListResponseModel extends PaginationModel {
  data: PaymentResponseModel[];
}

export interface SubscriptionStatusResponseModel {
  subscription_history: SubscriptionHistoryResponseModel;
  current_payment: PaymentResponseModel | null;
  next_billing_date: string | null;
  is_active: boolean;
}

// 빌링키 발급
export interface BillingKeyIssueRequestModel {
  customer_key: string;
  auth_key: string;
}

export interface BillingKeyIssueResponseModel {
  billing_key: string;
  customer_key: string;
  card_company: string | null;
  card_number: string | null;
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

export interface FacilityHistoryResponseModel {
  id: number;
  project_id: number;
  quotation_product_name: string;
  quantity: number;
  start_date: string;
  end_date: string;
  avg_production_time: number;
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
  history: FacilityHistoryResponseModel[];
}

// 설비 목록 조회
export interface EquipmentListResponseModel extends PaginationModel {
  data: EquipmentResponseModel[];
}

//////////////////////
// Factory Client API
// 거래체 등록
export interface ClientModel {
  factory_id?: number;
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
  is_customer?: boolean;
  is_supplier?: boolean;
  // type?: ClientType; // 거래처 유형 (발주처/수주처)
}

export interface ClientResponseModel {
  id: number;
  // type?: ClientType;
  is_customer?: boolean;
  is_supplier?: boolean;
  name: string;
  business_registration_number?: string;
  representative_name?: string;
  business_type?: string;
  business_category?: string;
  phone?: string;
  email?: string;
  note?: string;
  address?: string;
  manager_name?: string;
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
  // client_type?: ClientType;
  is_customer?: boolean;
  is_supplier?: boolean;
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

// 엑셀 대량등록 제품 등록
export interface ProductCreateExcelModel {
  name: string;
  code: string;
  unit: string;
  spec: string;
  current_stock?: number;
  average_production_time?: number;
  buffer_rate: number;
  note?: string;
}

export interface ProductCreateExcelResponseModel {
  id: number;
  factory: number;
  name: string;
  code: string;
  unit: string;
  spec?: string;
  current_stock: number;
  average_production_time: number;
  buffer_rate: number;
  note?: string;
  created_at: string;
  updated_at: string;
}

//////////////////////
// Product History API
// export interface ProductHistoryModel {
//   product: number; // product_id
//   type: 'in' | 'out'; // 입고 또는 출고
//   quantity: number; // 재고 변동 수량
//   total_stock: number; // 재고 변동 후 재고 수량
// }

export interface ProductHistoryResponseModel {
  id: number;
  product_id: number;
  project_id: number;
  client_name: string;
  production_quantity: number;
  delivery_quantity: number;
  quantity: number;
  total_stock: number;
  is_canceled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductHistoryListResponseModel extends PaginationModel {
  data: ProductHistoryResponseModel[];
}

//////////////////////
// Material API
// 원자재 생성 material_create_in
export interface CreateMaterialModel {
  name: string;
  code: string;
  spec: string;
  unit: string;
  current_stock?: number;
  standard_stock?: number;
}

// 원자재 수정
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
  id?: number;
  name: string;
  code: string;
  spec: string; // 규격
  unit: string; // 단위
  quantity: number | null;
  price: number | null; // 구매 단가
}

export interface MaterialHistoryModel {
  factory: number;
  client_info: ClientModel;
  materials: MaterialItemModel[];
}

// 업체별 단가 비교 & 원자재 입출고 내역// 원자재 히스토리 조회
export interface MaterialHistoryResponseModel {
  id: number; // material_history_id
  type: 'purchase' | 'consumption'; // 구매 또는 소모
  material_id: number; // 원자재 ID
  material_name: string; // 원자재명
  material_code: string; // 원자재 코드
  material_spec: string; // 원자재 규격
  material_unit: string; // 원자재 단위
  client_id: number | null; // 거래처 ID
  client_name: string | null; // 거래처명
  quantity: number; // 수량
  unit_price: number; // 구매 단가
  amount: number; // 금액(수량x단가)
  date: string; // 거래일자 (ISO8601)
  total_stock: number; // 거래 후 총 재고
  cash_receipt: number | null; // 현금영수증 ID
  national_tax_service_id: number | null; // 국세청 신고 ID
}

export interface MaterialHistoryListResponseModel extends PaginationModel {
  data: MaterialHistoryResponseModel[];
}

// 원자재 엑셀 대량등록
export interface MaterialCreateExcelModel {
  name: string;
  code: string;
  unit: string;
  spec: string;
  current_stock?: number;
  standard_stock?: number;
}

// export interface MaterialCreateExcelResponseModel {
//   id: number;
//   factory: number;
//   name: string;
//   code: string;
// }
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
  connection_id: number;
  material_id: number;
  material_name: string;
  material_code: string;
  material_spec: string;
  material_unit: string;
  material_current_stock: number;
  material_standard_stock: number;
  quantity: number; // // 제품 1개 생산에 필요한 원자재 수량
}

export interface ProductMaterialConnectionModel {
  connection_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  product_spec: string;
  product_unit: string;
  quantity: number; // 제품 1개 생산에 필요한 원자재 수량
}

export interface MaterialProductConnectionResponseModel {
  message: string;
  created_connections:
    | MaterialProductConnectionModel[]
    | ProductMaterialConnectionModel[]; // 생성된 연결 목록
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
// 프로젝트 생성 수정 응답
export interface CreateProjectResponseModel {
  id: number;
  status?: string;
  transact_date?: string; // 거래명세서 발행 일자 // 현재 사용 안함
  tax_invoice?: number;
  created_at: string;
  updated_at: string;
}

// 프로젝트 조회 요청
// 진행 중인 프로젝트: status="progress"
// 완료된 프로젝트: status="complete"
export interface ProjectResponseModel {
  client_name: string; // 변하는 이름?
  confirmed_at: string; // 주문서의 등록 일자
  created_at: string;
  id: number;
  is_refunded: boolean;
  name: string; // 변하는 이름?
  plans: ProjectPlanModel[]; // ProjectPlanModelOut
  printed_at: string; // 거래명세서 발행 일자
  quotations: ProjectQuotationModel[]; // QuotationModelOut
  status: ProjectStatusType;
  tax_invoice: PublishedTaxInvoiceResponseModel; // NationalTaxServiceOut
  transact_date: string; // 현재 사용 안하고 printed_at 사용
  updated_at: string;
}

export interface ProjectListResponseModel extends PaginationModel {
  data: ProjectResponseModel[];
}

// 프로젝트 상태 조회 응답
export interface ProjectQuotationProductsInfoModel {
  id: number;
  name: string;
  code: string;
  spec: string;
  unit: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  quotation_product_id: number;
}
export interface ProjectQuotationProductsModel {
  created_at: string;
  delivery_date: string;
  id: number;
  is_delivery: boolean;
  product: {
    average_production_time: number;
    buffer_rate: string; // 0.10
    code: string;
    created_at: string;
    current_stock: number;
    factory: number;
    id: number;
    name: string;
    note: string;
    spec: string;
    unit: string;
    updated_at: string;
  };
  product_info: {
    average_production_time: number;
    buffer_rate: number;
    code: string;
    created_at: string;
    current_stock: number;
    factory: number;
    id: number;
    location: number[];
    name: string;
    note: string;
    spec: string;
    unit: string;
    updated_at: string;
  };
  quantity: number;
  quotation: number;
  unit_price: number;
  updated_at: string;
}

export interface ProjectQuotationModel {
  id: number; // quotation_id
  client: number; // client_id
  client_info: TaxClientInfoModel;
  created_at: string;
  due_date: string;
  due_date_notice: boolean;
  factory: number; // factory_id
  factory_info: TaxFactoryInfoModel;
  products: ProjectQuotationProductsModel[];
  products_info: ProjectQuotationProductsInfoModel[];
  project: number; // project_id
  type: string;
  updated_at: string;
  uploaded_file: string;
}

export interface ProjectStatusResponseModel {
  created_at: string;
  due_date?: string;
  earliest_start_date?: string;
  id: number; // project_id
  is_refunded: boolean;
  latest_end_date?: string;
  logs: ProjectLogResponseModel[];
  name: string; // 프로젝트 이름?
  quotations: ProjectQuotationModel[];
  status: ProjectStatusType;
  updated_at: string;
  tax_invoice: PublishedTaxInvoiceResponseModel | null;
  transact_date: string; // 거래명세서 발행 일자
  printed_at: string;
  confirmed_at: string;
}

//////////////////////
//// Quotation API
//// OCR API

// OCR 결과 요청 아이템 스키마
export interface OcrRequestItemModel {
  item_name: string; // 품목명
  item_code?: string; // 품목코드
  spec?: string; // 규격
  unit: string; // 단위
  quantity: string; // 수량
  unit_price: string; // 단가
}

// OCR 결과 클라이언트 정보 스키마
export interface OcrClientInfoModel {
  company_name: string; // 업체명
  registration_number?: string; // 사업자등록번호
  ceo_name?: string; // 대표자명
  delivery_date?: string; // 납품일자
  business_type?: string; // 업태
  category?: string; // 종목
  address?: string; // 주소
  manager_name?: string; // 담당자명
  email?: string; // 이메일
  fax_number?: string; // 팩스번호
  call_number?: string; // 전화번호
}

// OCR 결과 전체 스키마
export interface OcrDataModel {
  client_info: OcrClientInfoModel; // 클라이언트 정보
  request_items: OcrRequestItemModel[]; // 요청 품목 리스트
}

// 견적서 상세 조회
export interface QuotationProductDetailResponseModel {
  productId: number | null;
  product_code: string;
  product_name: string;
  spec: string;
  unit: string;
  quantity: number | null;
  unit_price: number | null;
  supply_amount?: number | null; // 공급가액
  tax_amount?: number | null; // 세액
}
export interface QuotationResponseModel {
  // 거래처 정보
  client_id: number | null; // 거래처 ID
  factory_name: string; // factory name이지만 거래처 이름임
  business_registration_number?: string;
  representative_name?: string;
  email?: string;
  phone?: string;
  fax?: string;
  business_type?: string;
  business_category?: string;
  address?: string;
  manager_name?: string; // 담당자명
  products?: QuotationProductDetailResponseModel[]; // 주문 품목 정보
  due_date?: string; // 납기일
  uploaded_file?: string;
}

// 견적서 폼용 확장 모델
export interface QuotationFormModel extends ClientModel {
  due_date: string;
}
// 견적서 임시 저장 // 생산 시작
export interface QuotationProductModel {
  product_id: number;
  quantity: number;
  unit_price: number;
  is_delivery?: boolean;
  delivery_date?: string | null;
}

// export interface SaveDraftQuotationModel {
//   quotation_id: number;
//   client?: ClientModel;
//   products?: QuotationProductModel[];
//   due_date?: string;
//   uploaded_file?: string;
//   is_confirm: boolean;
// }

// 생산 시작용 데이터 모델
export interface ProductionDataModel {
  quotation_id?: number;
  client: {
    factory_id: number;
    client_id: number | null;
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
    // client_type: string;
    is_customer?: boolean;
    is_supplier?: boolean;
  };
  products: Array<{
    product_id: number;
    quantity: number;
    unit_price: number;
    is_delivery: boolean;
    delivery_date: null;
  }>;
  due_date?: string;
}

// 임시 저장용 데이터 모델
export interface SaveDraftDataModel {
  quotation_id: number | null;
  client: {
    factory_id: number;
    client_id: number | null;
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
    // client_type: string;
    is_customer?: boolean;
    is_supplier?: boolean;
  };
  products: Array<{
    product_id: number | null;
    quantity: number;
    unit_price: number;
    is_delivery: boolean;
    delivery_date: string | null;
  }>;
  due_date?: string;
  uploaded_file?: string;
  is_confirm: boolean;
}

// 견적서 품목 목록 조회
export interface QuotationProductResponseModel {
  id: number; // quotation_product_id
  quotation: number;
  product: number;
  quantity: number;
  unit_price: number;
  is_delivery?: boolean;
  delivery_date?: string | null;
}

// dashboard 납품되지 않은 견적서 품목 조회 응답
export interface UndeliveredProductModel {
  company_name: string;
  product_name: string;
  delivery_date: string | null;
  project_id: number;
}

export interface UndeliveredProductListResponseModel extends PaginationModel {
  data: UndeliveredProductModel[];
}

// 견적서 품목 히스토리 조회 // 이전에 생산했던 Quotation Product 항목을 조회
export interface QuotationProductHistoryItemResponseModel {
  product_name: string; // 제품 명
  quantity: number; // 제작 수량
  unit_price: number; // 단가
  total_amount: number; // 금액 (수량*단가)
  created_at: string;
}

// 견적서 품목 납품 상태 수정
export interface QuotationProductDeliveryUpdateModel {
  is_delivery: boolean;
  delivery_date?: string; // "YYYY-MM-DD" 형식
}

export interface QuotationProductDeliveryUpdateResponseModel {
  quotation_product_id: number;
  is_delivery: boolean;
  delivery_date?: string | null;
  message: string;
}

/////////////////////////////
// Project Log API
// 프로젝트 로그 생성
export interface ProjectLogModel {
  type: ProjectLogType;
  title: string;
  content: string;
}

export interface CreateProjectLogResponseModel {
  message: string;
  log_id: number;
}

// 프로젝트 로그 조회
export interface ProjectLogResponseModel {
  id: number; // 로그 아이디
  project_id: number;
  type: ProjectLogType;
  title: string;
  content: string;
  refund?: RefundModel;
  created_at: string;
  updated_at: string;
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
  buffer_rate: number;
}

export interface QuotationProductForPlanModel {
  id: number;
  product: ProductForPlanModel;
  quantity: number;
  unit_price: number;
  delivery_date: string;
  is_delivery: boolean;
}

export interface EquipmentForPlanModel {
  id: number;
  name: string;
  priority: number;
}

export interface ProjectPlanModel {
  id: number; // project_plan_id
  project_id: number;
  quotation_product: QuotationProductForPlanModel;
  equipment: EquipmentForPlanModel;
  status: OperationStatusType; // 가동 대기, 가동 중, 가동 완료
  quantity: number; // 생산 수량
  start_date: string; // 생산 시작 일자
  end_date: string; // 생산 종료 일자
  avg_production_time: number; // 단위당 소요 시간
  material_status: '충분' | '부족'; // 원자재 상태
}

export interface ProjectPlanListResponseModel extends PaginationModel {
  data: ProjectPlanModel[];
}

// 생산 계획 정보 수정
export interface CreateOrUpdateProjectPlanModel {
  plan_id?: number; // 수정 모드일 때만 사용
  project_id: number;
  quotation_product_id: number;
  equipment_id: number;
  quantity: number;
  start_date: string;
  end_date: string;
  avg_production_time: number;
  status?: OperationStatusType;
  total_amount: number; // 총 주문 수량 (buffer_rate 계산 용)
  total_quantity: number; // 총 생산 수량 (buffer_rate 계산 용)
}

//////////////////////
// Project Refund API
// 반품 생성
export interface CreateRefundModel {
  project_id: number;
  product_id: number;
  refund_date: string; // YYYY-MM-DD 형식
  refund_amount?: number | null;
}

export interface CreateRefundResponseModel {
  message: string;
  refund_id: number;
  log_id: number;
}

// 반품 가져오기
export interface RefundModel {
  id: number;
  product: {
    id: number;
    name: string;
    code: string;
    current_stock: number;
    spec: string;
    unit: string;
  };
  project: {
    id: number;
    status: string;
  };
  amount: number;
  current_stock: number;
  production_amount: number;
  refund_date?: string | null;
  log: {
    id: number;
    title: string;
    content: string;
    created_at: string;
  };
  plan?: {
    id: number; // project_plan_id
    project_id: number;
    quantity: number;
    status: OperationStatusType;
    avg_production_time: number;
    start_date: string;
    end_date: string;
  } | null;
  created_at: string;
  updated_at: string;
}

// 반품 수정
export interface UpdateRefundModel {
  amount: number;
  production_amount: number;
  refund_date: string;
}

// 반품으로 생산계획 생성하기
export interface RegisterProductionFromRefundResponseModel {
  message: string;
  refund_id: number;
  updated_project_plans: number[];
  deleted_project_plans: number[];
  created_project_plans: number[];
}

// 대시보드
export interface MonthlyProfitModel {
  month: string;
  profit: number;
}

export interface DashboardResponseModel {
  current_month_projects: number;
  previous_month_projects: number;
  shortage_materials_count: number;
  monthly_profits: MonthlyProfitModel[];
  last_year_monthly_profits: MonthlyProfitModel[];
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
  user?: number | null; // 가입된 멤버는 user_id, 미가입 초대자는 null
  name?: string; // 사용자의 이름, 미가입 초대자는 빈 문자열
  email: string;
  role: MemberRoleType;
  status: MemberStatusType;
  invited_at: string | null; // 초대일시 (초대 대기자는 null일 수 있음)
  invited_by: number;
  created_at: string;
  updated_at: string;
  is_barobill_user: boolean;
  barobill_id: string | null;
  barobill_password: string | null;
  invitation_message: string | null;
  invitation_token: string | null;
}

export interface MemberListResponseModel extends PaginationModel {
  data: MemberResponseModel[];
}

// 멤버 수정
export interface UpdateMemberResponseModel {
  id: number;
  factory: number;
  user: number;
  role: MemberRoleType;
  status: MemberStatusType;
  invited_by: number;
  invited_at: string;
  invitation_token: string;
  invitation_message: string;
  is_barobill_user: boolean;
  barobill_id: string;
  barobill_password: string;
  created_at: string;
  updated_at: string;
}

//////////////////////
// Notification API
export interface NotificationResponseModel {
  id: number;
  receiver: number; // FactoryMember ID
  type: NotificationType;
  case: NotificationCaseType;
  content: string;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponseModel extends PaginationModel {
  data: NotificationResponseModel[];
}

//////////////////////
// 세금계산서 api
// 발행 완료 세금계산서
export interface TaxFactoryInfoModel {
  id: number;
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

export interface TaxClientInfoModel {
  // 거래처 정보 (FactoryClientRowOut 구조)
  id: number;
  factory: number;
  // type: ClientType; // "customer"/"supplier"
  is_customer?: boolean;
  is_supplier?: boolean;
  name: string;
  business_registration_number: string;
  representative_name: string;
  email: string;
  phone: string;
  fax: string;
  business_type: string;
  business_category: string;
  address: string;
  manager: string;
  note?: string;
}

export interface TaxProductInfoModel {
  id: number;
  factory: number;
  name: string;
  code: string;
  spec: string;
  unit: string;
  current_stock?: number;
  average_production_time?: number;
  buffer_rate?: number; // Decimal → float 변환
  note?: string;
  created_at?: string; // "YYYY-MM-DD HH:MM:SS" 형식
  updated_at?: string; // "YYYY-MM-DD HH:MM:SS" 형식
}

// tax invoice detail 가져오기
export interface TaxLineItemModel {
  id: number; //품목 식별자(순번)
  purchase_expiry: string; // YYYYMMDD 형식 (예: "20241231") // 공급일자
  // product?: number; // 연동된 제품 ID
  name: string; // 품목명
  information?: string; // 규격
  chargeable_unit: string; // 수량
  unit_price: string; // 단가
  amount: string; // 공급가액
  tax: string; // 세액
  description?: string; // 비고
  material_history?: number; // 연동된 자재 이력 ID
}

// NationalTaxServiceOut
export interface PublishedTaxInvoiceResponseModel {
  // BaseModel 상속 필드
  id: number; // Primary Key
  created_at: string; // 생성일
  updated_at: string; // 수정일

  // User 관련
  user: number; // User ID (ForeignKey)

  // Factory 관련
  factory: number; // Factory ID (ForeignKey)
  factory_info: TaxFactoryInfoModel; // 공장 정보 (FactoryRowOut 구조)

  // 세금계산서 기본 정보
  publish_status: TaxStatusType; // 발행 상태 ("temporary"/"pending"/"published")
  tax_invoice_type: TaxDocumentType; // 세금계산서 유형 ("sales"/"purchase")
  transaction_type: TransactionType; // 거래 유형 ("receipt"/"invoice")
  transaction_date: string; // 거래 일자

  // 거래처 관련
  client: number; // FactoryClient ID (ForeignKey)
  client_info: TaxClientInfoModel;

  // 제품 관련 // 세금계산서 생성/수정 시 저장
  product: number[]; // Product IDs (ManyToMany)
  products_info: TaxProductInfoModel[]; // 제품 정보 리스트 (ProductRowOut 구조)

  // 금액 관련
  transaction_amount: number; // 공급 가액
  tax_amount: number; // 세액

  // 세금계산서 관리 정보
  is_hidden: boolean; // 숨김 여부
  mgt_key: string; // 관리 키 (20자리 숫자)
  nts_send_key: string; // 국세청 승인번호
  barobill_state: BarobillStateType; // 바로빌 상태
  nts_send_state: NtsSendStateType; // 국세청 전송 상태

  // 세금계산서 품목 상세 // 바로빌 API로 세금계산서 발행 후 또는 동기화 시 저장
  line_items: TaxLineItemModel[];
}

export interface PublishedTaxInvoiceListResponseModel extends PaginationModel {
  data: PublishedTaxInvoiceResponseModel[];
}

export interface PendingTaxInvoiceListResponseModel extends PaginationModel {
  data: PublishedTaxInvoiceResponseModel[];
}

// 미연결 세금계산서
export interface UnlinkedTaxInvoiceResponseModel {
  id: number;
  tax_invoice_type: string;
  transaction_date: string;
  client_name: string;
  product_names: string[];
  transaction_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface UnlinkedTaxInvoiceListResponseModel extends PaginationModel {
  data: UnlinkedTaxInvoiceResponseModel[];
}

// 세금계산서 생성
export interface CreateTaxInvoiceModel {
  tax_id?: number; // 세금계산서 ID (임시저장 시 사용)
  factory: number;
  client: number;
  product?: number[]; // 품목 ID 리스트
  line_items: TaxLineItemModel[];
  tax_invoice_type?: TaxDocumentType;
  transaction_type?: TransactionType;
  transaction_date: string;
  transaction_amount: number; // 공급가액
  tax_amount: number; // 세액
  is_hidden: boolean; // 숨김 여부 // default: false
}

// material_history_id로 세금계산서(구매) 및 자재정보를 조회
export interface TaxInvoiceByMaterialResponseModel {
  client_name: string;
  business_registration_number: string;
  representative_name: string | null;
  business_type: string | null;
  business_category: string | null;
  address: string | null;
  transaction_date: string;
  tax_invoice_type: string;
  transaction_type: string;
  materials: {
    material_name: string;
    spec: string;
    quantity: number;
    unit: string;
    price: number;
    transaction_amount: number;
    tax_amount: number;
  }[];
}

//////////////////////
// 현금영수증 관련 api
// 현금영수증 목록 조회
export interface CashReceiptListParamsModel {
  factory_id: number;
  q?: string;
  start_date?: string;
  end_date?: string;
  order?: 'desc' | 'asc';
  page?: number;
  page_size?: number;
}

export interface CashReceiptResponseModel {
  id: number; // 영수증 id
  transaction_date: string;
  client_name: string;
  product_names: string[];
  transaction_amount: number;
  tax_amount: number;
  total_amount: number;
}

export interface CashReceiptListResponseModel extends PaginationModel {
  data: CashReceiptResponseModel[];
}

export interface CashReceiptDetailResponseModel {
  id: number;
  created_at: string;
  updated_at: string;
  user: number;
  factory: number;
  factory_info: TaxFactoryInfoModel;
  cash_receipt_type: TaxDocumentType;
  transaction_date: string;
  client: number;
  client_info: TaxClientInfoModel;
  product: number[];
  products_info: TaxProductInfoModel;
  transaction_amount: number; // 공급가액
  tax_amount: number; // 세액
  service_charge: number;
  nts_confirm_num: string;
  franchise_corp_num: string;
  franchise_corp_name: string;
  franchise_ceo_name: string;
  franchise_addr: string;
  franchise_tel: string;
  identity_num: string;
  trade_type: string;
  trade_usage: string;
  trade_method: string;
  item_name: string;
  cancel_type: string;
  cancel_nts_confirm_num: string;
  cancel_nts_confirm_date: string;
}

export interface CashReceiptByMaterialModel {
  transaction_date: string;
  approval_number: string;
  transaction_classification: string;
  transaction_purpose: string;
  client_name: string;
  business_registration_number: string;
  representative_name: string | null;
  address: string | null;
  materials: {
    material_name: string;
    unit: string;
    quantity: number;
    price: number;
    transaction_amount: number;
    tax_amount: number;
    total_amount: number;
  }[];
}

export interface CashReceiptSyncResponseModel {
  message: string;
  sales_count: number;
  purchase_count: number;
}

//////////////////////
// Work Instruction API
export interface WorkInstructionsPlanModel {
  avg_production_time: number;
  client_name: string;
  created_at: string;
  end_date: string;
  end_notification: boolean;
  equipment: number;
  id: number;
  product: number; // product_id
  product_name: string;
  project: number; // project_id
  quantity: number;
  start_date: string;
  status: OperationStatusType;
  updated_at: string;
}

export interface WorkInstructionsResponseModel {
  id: number;
  factory: number;
  plans: WorkInstructionsPlanModel[];
  memo: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkInstructionListResponseModel extends PaginationModel {
  data: WorkInstructionsResponseModel[];
}

// detail
export interface WorkInstructionDetailPlanModel {
  avg_production_time: number;
  client_name: string;
  created_at: string;
  end_date: string;
  end_notification: boolean;
  equipment: number;
  equipment_name: string;
  id: number;
  product: number;
  product_code: string;
  product_name: string;
  product_spec: string;
  product_unit: string;
  product_note: string | null;
  project: number;
  quantity: number;
  start_date: string;
  status: OperationStatusType;
  updated_at: string;
}
export interface WorkInstructionDetailResponseModel {
  id: number;
  factory: number;
  plans: WorkInstructionDetailPlanModel[];
  memo: string | null;
  created_at: string;
  updated_at: string;
}

////////////
// 바로빌 관련 api
export interface BarobillCorpCertModel {
  factory: string; // 공장 ID
  barobill_id: string; // 바로빌 ID
  barobill_password: string; // 바로빌 비밀번호
}

//////////////////////

// import { TodayProductionPlanModel } from '@/app/(with-layout)/dashboard/type';

// export interface PaymentResultResponseModel {
//   payment_key: string;
//   order_id: string;
//   amount: number;
//   status: string;
//   approved_at: string | null;
//   method: string | null;
// }

// export interface PaymentCancelResponseModel {
//   payment_key: string;
//   cancel_amount: number;
//   cancel_reason: string;
//   canceled_at: string;
// }

// export interface SubscriptionStatusResponseModel {
//   subscription_history: SubscriptionHistoryResponseModel;
//   current_payment: PaymentResponseModel | null;
//   next_billing_date: string | null;
//   is_active: boolean;
// }

//////////////////////
import {
  MemberRoleType,
  MemberStatusType,
  ProjectStatusType,
  TaxStatusType,
  EquipmentStatusType,
  ProjectLogType,
  OperationStatusType,
  NotificationType,
  NotificationCaseType,
  TaxDocumentType,
  // ClientType,
  TransactionType,
  BarobillStateType,
  NtsSendStateType,
  SubscriptionStatusType,
  PaymentStatusType,
} from './status-type';

export type {
  MemberRoleType,
  MemberStatusType,
  ProjectStatusType,
  TaxStatusType,
} from './status-type';
