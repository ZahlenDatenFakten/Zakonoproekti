export const getWeekInfo = (dateString: string) => {
  const d = new Date(dateString);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  
  const startOfWeek = new Date(d);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const formatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });
  const yearFormatter = new Intl.DateTimeFormat('ru-RU', { year: 'numeric' });
  
  return {
    label: `Пак: ${formatter.format(startOfWeek)} — ${formatter.format(endOfWeek)} ${yearFormatter.format(endOfWeek)} г.`,
    timestamp: startOfWeek.getTime(),
  };
};

import type { Bill, BillPack } from '../types/bill';

export const groupBillsByWeek = (bills: Bill[]): BillPack[] => {
  const groups = new Map<number, BillPack>();

  bills.forEach((bill) => {
    // For Federal Government bills, use the time they were approved by the Commission (federalVerdict.updatedAt or bill.updatedAt)
    // Actually, to keep it simple, we group by the bill's creation/update date depending on status
    const dateToUse = (bill.status === 'approved' && bill.federalVerdict) ? bill.federalVerdict.updatedAt : bill.createdAt;
    
    const weekInfo = getWeekInfo(dateToUse);
    
    if (!groups.has(weekInfo.timestamp)) {
      groups.set(weekInfo.timestamp, {
        id: `pack-${weekInfo.timestamp}`,
        label: weekInfo.label,
        timestamp: weekInfo.timestamp,
        bills: []
      });
    }
    
    groups.get(weekInfo.timestamp)!.bills.push(bill);
  });

  return Array.from(groups.values()).sort((a, b) => b.timestamp - a.timestamp);
};
