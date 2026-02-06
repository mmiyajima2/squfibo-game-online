/**
 * CPUの難易度
 */
export type CPUDifficulty = 'Easy' | 'Normal' | 'Hard';

/**
 * CPU難易度のラベル（日本語表示用）
 */
export const CPU_DIFFICULTY_LABELS: Record<CPUDifficulty, string> = {
  Easy: '簡単',
  Normal: '普通',
  Hard: '難しい',
};

/**
 * CPU難易度の有効/無効フラグ
 */
export const CPU_DIFFICULTY_ENABLED: Record<CPUDifficulty, boolean> = {
  Easy: true,
  Normal: true,
  Hard: false,
};

/**
 * 有効なCPU難易度の配列
 */
export const VALID_CPU_DIFFICULTIES: readonly CPUDifficulty[] = ['Easy', 'Normal', 'Hard'] as const;

/**
 * CPU難易度が有効かどうかを検証する
 */
export function isValidCPUDifficulty(difficulty: string): difficulty is CPUDifficulty {
  return VALID_CPU_DIFFICULTIES.includes(difficulty as CPUDifficulty);
}
