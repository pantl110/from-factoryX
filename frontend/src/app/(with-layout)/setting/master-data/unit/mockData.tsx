export interface UnitConversionData {
  id: number;
  category: '자재' | '제품';
  name: string;
  standardConversionUnit: string; // 기준/변환 단위
  conversionFormula: string; // 변환식
  decimalRule: '반올림' | '버림' | '올림';
}

export const mockUnitConversionData: UnitConversionData[] = [
  {
    id: 1,
    category: '자재',
    name: '자재명 1',
    standardConversionUnit: 'kg/봉',
    conversionFormula: '1Kg=2봉',
    decimalRule: '반올림',
  },
  {
    id: 2,
    category: '제품',
    name: '품목명 1',
    standardConversionUnit: 'kg/봉',
    conversionFormula: '1Kg=2봉',
    decimalRule: '반올림',
  },
  {
    id: 3,
    category: '자재',
    name: '철판 A',
    standardConversionUnit: '톤/장',
    conversionFormula: '1톤=10장',
    decimalRule: '버림',
  },
  {
    id: 4,
    category: '제품',
    name: '완제품 B',
    standardConversionUnit: '개/박스',
    conversionFormula: '1박스=50개',
    decimalRule: '올림',
  },
  {
    id: 5,
    category: '자재',
    name: '플라스틱 원료',
    standardConversionUnit: 'kg/포',
    conversionFormula: '1포=25kg',
    decimalRule: '반올림',
  },
  {
    id: 6,
    category: '제품',
    name: '부품 C',
    standardConversionUnit: '개/팩',
    conversionFormula: '1팩=100개',
    decimalRule: '반올림',
  },
];
