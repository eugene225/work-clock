export type WorkLocation = '사무실' | '재택';

export interface WorkRecord {
  date: string; // 'MM.DD 월' 형식
  checkIn: string | null; // 'HH:mm' 형식
  checkOut: string | null; // 'HH:mm' 형식
  workAt: WorkLocation | null;
  breakTime: string | null; // 'HH:mm' 형식
}

export interface WorkTimeResult {
  totalHours: number;
  remainingMinutes: number;
  missingDates: string[];
}

export interface LoginResult {
  success: boolean;
  records?: WorkRecord[];
  error?: string;
} 