import { ClientType } from "@/app/(with-layout)/setting/master-data/client/types";

export interface ClientDataModel {
  id: number;
  type: ClientType;
  companyName: string;
  businessNumber: string;
  representativeName: string;
  businessType: string; // 업태
  businessCategory: string; // 종목
  contact: string;
  email: string;
}

export const clientData: ClientDataModel[] = [
  {
    id: 1,
    type: "수주처",
    companyName: "(주)한솔케미칼",
    businessNumber: "220-81-12345",
    representativeName: "김한솔",
    businessType: "제조업",
    businessCategory: "시설성형",
    contact: "02-3456-7890",
    email: "purchasing@hansolchem.com",
  },
  {
    id: 2,
    type: "발주처",
    companyName: "(주)에코플라스틱",
    businessNumber: "123-45-67890",
    representativeName: "박환경",
    businessType: "도소매",
    businessCategory: "플라스틱 원료",
    contact: "031-111-2222",
    email: "sales@ecoplastic.co.kr",
  },
  {
    id: 3,
    type: "수주처",
    companyName: "미래자동차",
    businessNumber: "333-22-11111",
    representativeName: "최미래",
    businessType: "제조업",
    businessCategory: "자동차 부품",
    contact: "052-987-6543",
    email: "rnd@miraemotors.com",
  },
  {
    id: 4,
    type: "발주처",
    companyName: "강철산업",
    businessNumber: "456-78-90123",
    representativeName: "이강철",
    businessType: "제조업",
    businessCategory: "철강",
    contact: "054-280-5000",
    email: "info@steelkorea.com",
  },
];
