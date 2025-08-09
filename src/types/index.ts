export type WorkLocation = '사무실' | '재택';

export interface WorkRecord {
  date: string; // 'MM.DD 월' 형식
  totalTime: string; // 'HH:MM' 형식
}

export interface WorkTimeResult {
  totalHours: number;
  remainingMinutes: number;
  countDate: number;
  requiredHours: number;
  requiredMinutes: number;
  differenceHours: number;
  differenceMinutes: number;
  isOverTime: boolean;
}

export interface LoginResult {
  success: boolean;
  records?: WorkRecord[];
  error?: string;
} 