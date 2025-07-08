import { DocumentType } from "@/app/(with-layout)/document/types";

export interface DocumentDataModel {
  id: string;
  documentType: DocumentType;
  companyName: string;
  productName: string;
  date: string;
  supplyPrice?: number;
  taxPrice?: number;
  totalPrice?: number;
  writtenDate?: string;
}

const documentData: DocumentDataModel[] = [
  {
    id: "a1b2c3d4-0001-0000-0000-000000000001",
    documentType: "주문서",
    companyName: "플라스틱이 좋아",
    productName: "플라스틱",
    date: "2025-06-31",
  },
  {
    id: "a1b2c3d4-0001-0000-0000-000000000034",
    documentType: "주문서",
    companyName: "플라스틱이 냠",
    productName: "플라스틱 고리 외 3개",
    date: "2025-06-15",
  },
  {
    id: "a1b2c3d4-0002-0000-0000-000000000002",
    documentType: "생산지시서",
    companyName: "다이몰드",
    productName: "플라스틱",
    date: "2024-06-31",
  },
  {
    id: "a1b2c3d4-0003-0000-0000-000000000003",
    documentType: "거래명세서",
    companyName: "금형마스터",
    productName: "플라스틱",
    date: "2025-06-31",
  },
  {
    id: "a1b2c3d4-0004-0000-0000-000000000004",
    documentType: "매출 세금계산서",
    companyName: "테크파츠",
    productName: "플라스틱",
    date: "2025-06-25",
    supplyPrice: 100000,
    taxPrice: 10000,
    totalPrice: 110000,
    writtenDate: "2025-07-03",
  },
  {
    id: "a1b2c3d4-0005-0000-0000-000000000005",
    documentType: "매입 세금계산서",
    companyName: "테크파츠",
    productName: "플라스틱",
    date: "2025-06-31",
    supplyPrice: 100000,
    taxPrice: 10000,
    totalPrice: 110000,
    writtenDate: "2025-07-09",
  },
  {
    id: "a1b2c3d4-0006-0000-0000-000000000006",
    documentType: "주문서",
    companyName: "에코그린",
    productName: "친환경 용기",
    date: "2024-12-01",
  },
  {
    id: "a1b2c3d4-0007-0000-0000-000000000007",
    documentType: "생산지시서",
    companyName: "다이몰드",
    productName: "금형 부품",
    date: "2024-11-20",
  },
  {
    id: "a1b2c3d4-0008-0000-0000-000000000008",
    documentType: "거래명세서",
    companyName: "금형마스터",
    productName: "금형 세트",
    date: "2025-01-15",
  },
  {
    id: "a1b2c3d4-0009-0000-0000-000000000009",
    documentType: "주문서",
    companyName: "플라스틱월드",
    productName: "플라스틱 컵",
    date: "2023-09-10",
  },
  {
    id: "a1b2c3d4-0010-0000-0000-000000000010",
    documentType: "매출 세금계산서",
    companyName: "테크파츠",
    productName: "플라스틱",
    date: "2024-10-05",
    supplyPrice: 100000,
    taxPrice: 10000,
    totalPrice: 110000,
    writtenDate: "2025-06-15",
  },
  {
    id: "a1b2c3d4-0011-0000-0000-000000000011",
    documentType: "매입 세금계산서",
    companyName: "에코그린",
    productName: "친환경 용기",
    date: "2024-08-22",
    supplyPrice: 100000,
    taxPrice: 10000,
    totalPrice: 110000,
    writtenDate: "2025-06-31",
  },
  {
    id: "a1b2c3d4-0012-0000-0000-000000000012",
    documentType: "생산지시서",
    companyName: "플라스틱월드",
    productName: "플라스틱 컵",
    date: "2023-12-25",
  },
  {
    id: "a1b2c3d4-0013-0000-0000-000000000013",
    documentType: "거래명세서",
    companyName: "에코그린",
    productName: "친환경 용기",
    date: "2024-07-30",
  },
  {
    id: "a1b2c3d4-0014-0000-0000-000000000014",
    documentType: "주문서",
    companyName: "메탈프로",
    productName: "금속 부품",
    date: "2024-05-15",
  },
  {
    id: "a1b2c3d4-0015-0000-0000-000000000015",
    documentType: "주문서",
    companyName: "텍스타일코리아",
    productName: "직물 소재",
    date: "2024-08-20",
  },
  {
    id: "a1b2c3d4-0016-0000-0000-000000000016",
    documentType: "주문서",
    companyName: "전자파트",
    productName: "전자 부품",
    date: "2024-09-12",
  },
  {
    id: "a1b2c3d4-0017-0000-0000-000000000017",
    documentType: "주문서",
    companyName: "화학산업",
    productName: "화학 원료",
    date: "2024-10-08",
  },
  {
    id: "a1b2c3d4-0018-0000-0000-000000000018",
    documentType: "주문서",
    companyName: "자동차부품",
    productName: "자동차 부품",
    date: "2024-11-25",
  },
  {
    id: "a1b2c3d4-0019-0000-0000-000000000019",
    documentType: "주문서",
    companyName: "건축자재",
    productName: "건축 자재",
    date: "2024-12-03",
  },
  {
    id: "a1b2c3d4-0020-0000-0000-000000000020",
    documentType: "주문서",
    companyName: "식품포장",
    productName: "식품 포장재",
    date: "2025-01-18",
  },
  {
    id: "a1b2c3d4-0021-0000-0000-000000000021",
    documentType: "주문서",
    companyName: "의료기기",
    productName: "의료 기기 부품",
    date: "2025-02-14",
  },
];

export default documentData;
