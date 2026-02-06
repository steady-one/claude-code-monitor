// 차트에서 사용하는 공유 색상 팔레트
// oklch 색상 공간을 사용하여 일관된 채도/밝기 유지

/** 사용자 구분용 색상 (8개) */
export const USER_COLORS: readonly string[] = [
  'oklch(0.65 0.2 250)',   // 파랑
  'oklch(0.6 0.18 165)',   // 청록
  'oklch(0.75 0.15 85)',   // 노랑-초록
  'oklch(0.6 0.2 300)',    // 보라
  'oklch(0.55 0.15 45)',   // 주황
  'oklch(0.7 0.18 200)',   // 하늘
  'oklch(0.65 0.15 130)',  // 초록
  'oklch(0.58 0.2 350)',   // 분홍
] as const;

/** 모델 구분용 색상 (5개) */
export const MODEL_COLORS: readonly string[] = [
  'oklch(0.65 0.2 250)',   // 파랑
  'oklch(0.6 0.18 165)',   // 청록
  'oklch(0.75 0.15 85)',   // 노랑-초록
  'oklch(0.6 0.2 300)',    // 보라
  'oklch(0.55 0.15 45)',   // 주황
] as const;
