import { WorkRecord, WorkTimeResult } from '../types/index.js';

export function calculateMonthlyWorkTime(records: WorkRecord[]): WorkTimeResult {
  let totalMinutes = 0;
  let countDate = 0;

  for (const record of records) {
    const recordDate = new Date(record.date);
    if(recordDate > new Date()) {
      break;
    }
    
    // HH:MM 형식을 분 단위로 변환
    const [hours, minutes] = record.totalTime.split(':').map(Number);
    totalMinutes += hours * 60 + minutes;
    countDate++;
  }

  // 총 해야 되는 근무시간 (센 날짜 * 8시간)
  const requiredMinutes = countDate * 8 * 60; // 8시간 = 480분
  const actualMinutes = totalMinutes;
  const differenceMinutes = actualMinutes - requiredMinutes;

  return {
    totalHours: Math.floor(totalMinutes / 60),
    remainingMinutes: Math.round(totalMinutes % 60),
    countDate,
    requiredHours: Math.floor(requiredMinutes / 60),
    requiredMinutes: requiredMinutes % 60,
    differenceHours: Math.floor(differenceMinutes / 60),
    differenceMinutes: Math.round(differenceMinutes % 60),
    isOverTime: differenceMinutes > 0
  };
} 