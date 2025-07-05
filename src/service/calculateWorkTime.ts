import { WorkRecord, WorkTimeResult } from '../types/index.js';
import { WorkLocation } from '../types/index';

export function calculateMonthlyWorkTime(records: WorkRecord[]): WorkTimeResult {
  let totalMinutes = 0;
  const missingDates: string[] = [];

  for (const record of records) {
    const { date, checkIn, checkOut, workAt } = record;
    
    // 재택 근무일은 무조건 8시간 (480분)
    if (workAt === '재택') {
      totalMinutes += 480;
      continue;
    }
    
    // 출퇴근 기록이 없는 경우 누락으로 처리
    if (!checkIn || !checkOut) {
      missingDates.push(date);
      continue;
    }
    
    // 사무실 근무일은 실제 출퇴근 시간으로 계산
    const start = new Date(`1970-01-01T${checkIn}:00`);
    const end = new Date(`1970-01-01T${checkOut}:00`);
    let minutes = (end.getTime() - start.getTime()) / 60000 - 60; // 점심시간 제외
    totalMinutes += minutes;
  }

  return {
    totalHours: Math.floor(totalMinutes / 60),
    remainingMinutes: Math.round(totalMinutes % 60),
    missingDates
  };
} 