// 데이터 모델
export interface ApiPaginationInfo {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
}

export interface ApiResponse<T> {
  count: number;
  totalCnt: number;
  pageCnt: number;
  curPage: number;
  nextPage: number;
  previousPage: number;
  data: T[];
}

export interface FactoryDataModel {
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

export type FactoryApiResponse = ApiResponse<FactoryDataModel>;

// 여기는 목데이터 데이터 모델!!! 나중에 지우기!
export interface MaterialModel {
  id: number;
  materialName: string;
  usageQuantity: string;
}

export interface ProductDataModel {
  id: number | null;
  productName: string;
  productCode?: string;
  size: string;
  unit: string;
  stock?: number;
  productionTime?: string;
  location?: string;
  comment?: string[];
  returnQuantity?: number;
  [key: string]: unknown;
}

export interface MaterialDataModel {
  id: string;
  materialName: string;
  size: string;
  usageQuantity?: number | null;
  unitPrice?: number | null;
  unit?: string;
  [key: string]: unknown;
}

import { ClientType } from "@/app/(with-layout)/setting/master-data/client/types";
export interface ClientDataModel {
  id: string;
  type: ClientType;
  companyName: string;
  businessNumber: string;
  representativeName: string;
  dueDate: string;
  businessType?: string; // 업태
  businessCategory?: string; // 종목
  companyAddress: string;
  responsibleName: string;
  email: string;
  contact?: string;
  fax?: string;
  deliveryAddress?: string;
  comment?: string;
  [key: string]: unknown;
}
