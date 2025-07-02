export interface ProfileFormDataModel {
  name: string;
  role: string;
  email: string;
  phone: string;
  [key: string]: unknown;
}

export interface CompanyFormDataModel {
  companyName: string;
  businessNumber: string;
  ceoName: string;
  managerEmail: string;
  managerPhone?: string;
  managerFax?: string;
  businessType: string;
  businessCategory: string;
  address: string;
  [key: string]: string | undefined;
}

export interface MemberFromDataModel {
  email: string;
  auth: string;
  id: string;
}
