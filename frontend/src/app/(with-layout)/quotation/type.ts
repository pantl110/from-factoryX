// 견적서-세금계산서 동기화용 공통 타입

// 거래처 정보 동기화 타입
export interface ClientDataSyncModel {
  name?: string;
  business_registration_number?: string;
  representative_name?: string;
  business_type?: string;
  business_category?: string;
  address?: string;
  email?: string;
  phone?: string;
  fax?: string;
  manager?: string;
  note?: string;
  due_date?: string;
}

// 주문 품목 정보 동기화 타입
export interface ProductDataSyncModel {
  productId: number;
  product_code: string;
  product_name: string;
  spec: string;
  unit: string;
  quantity: number;
  unit_price: number;
  is_delivery: boolean;
  delivery_date: string | null;
}

// 세금계산서 생성 패널 props 타입
export interface CreateTaxPanelSyncProps {
  initialClientData?: ClientDataSyncModel;
  initialProducts?: ProductDataSyncModel[];
}
