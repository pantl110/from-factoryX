export type TermType =
  | 'INVOICE_30'
  | 'INVOICE_EOM_NEXT'
  | 'CUSTOM';

export const TERM_LABEL_MAP: Record<TermType, string> = {
  INVOICE_30: '세금계산서 발행 후 30일 이내 입금',
  INVOICE_EOM_NEXT: '세금계산서 발행 익월 말일 입금',
  CUSTOM: '',
};
