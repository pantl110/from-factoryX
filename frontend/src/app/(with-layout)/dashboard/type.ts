// 오늘 생산량
export interface DailyProductionQuantityModel {
  production_count: number; // 오늘 완료된 품목 개수
  production_quantity: number; // 오늘 총 생산 수량
  previous_month_count: number | null; // 전월 품목 개수 (첫 달이면 null)
  previous_month_quantity: number | null; // 전월 총 생산 수량 (첫 달이면 null)
  change_percentage: number | null; // 변화율 (첫 달이면 null)
  is_first_month: boolean; // 가입 첫 달 여부
}

// 부족한 원자재 수
export interface ShortageMaterialCountModel {
  shortage_count: number; // 부족한 원자재 수
  total_materials: number; // 전체 원자재 수
  shortage_percentage: number; // 부족 비율 (%)
}

// 생산 수익률
export interface ProductionProfitRateModel {
  current_month_profit: number; // 현재 월 수익 (총 매출액)
  current_month_count: number; // 해당 월에 완료된 프로젝트 개수
  previous_month_profit: number | null;
  previous_month_count: number | null;
  change_percentage: number | null;
}

// 오늘의 생산 일정
export interface TodayProductionPlanModel {
  company_name: string;
  equipment_name: string;
  product_code: string;
  product_name: string;
  production_quantity: number;
  production_time: number;
  project_id: number;
  spec: string;
  unit: string;
  start_date: string;
  end_date: string;
}

// 납품 예정 현황
export interface UndeliveredProductModel {
  company_name: string;
  product_name: string;
  delivery_date: string | null;
  project_id: number;
}
