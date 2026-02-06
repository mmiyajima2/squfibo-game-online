export type CPUDifficulty = 'Easy' | 'Normal' | 'Hard';

export const CPU_DIFFICULTY_LABELS: Record<CPUDifficulty, string> = {
  Easy: '簡単',
  Normal: '普通',
  Hard: '難しい',
};

export const CPU_DIFFICULTY_ENABLED: Record<CPUDifficulty, boolean> = {
  Easy: true,
  Normal: true,
  Hard: false,
};
