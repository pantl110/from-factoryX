/**
 * 비교용: trim + 전각→반각(NFKC) 정규화.
 * 화면 표시 값은 원문 유지하고, 문자열 매칭 시에만 사용.
 */
export function normalizeForMatch(s: string | undefined): string {
  return (s ?? '').trim().normalize('NFKC');
}
