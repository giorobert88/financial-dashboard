import fs from "fs";
import path from "path";

export type PaydayFrequency = "monthly" | "bi_weekly" | "weekly";

export interface PaydayConfig {
  frequency?: PaydayFrequency;
  ruleType: "fixed_date" | "last_working_day" | "last_friday";
  fixedDate?: number; // 1-31
  rollbackWeekend?: boolean; // If true, shifts to preceding Friday if on a weekend
  anchorDate?: string; // YYYY-MM-DD
}

const AUTH_FILE_PATH = process.env.AUTH_FILE_PATH || path.join(process.cwd(), ".dashboard_auth");
const PAYDAY_CONFIG_PATH = process.env.PAYDAY_CONFIG_PATH || path.join(path.dirname(AUTH_FILE_PATH), ".payday_config");

export function getPaydayConfig(): PaydayConfig {
  try {
    if (fs.existsSync(PAYDAY_CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(PAYDAY_CONFIG_PATH, "utf-8"));
      if (data && typeof data === "object") {
        return {
          frequency: data.frequency || "monthly",
          ruleType: data.ruleType || "fixed_date",
          fixedDate: typeof data.fixedDate === "number" ? data.fixedDate : 20,
          rollbackWeekend: typeof data.rollbackWeekend === "boolean" ? data.rollbackWeekend : true,
          anchorDate: typeof data.anchorDate === "string" ? data.anchorDate : undefined,
        };
      }
    }
  } catch (error) {
    console.error("Error reading payday config, using default", error);
  }
  return {
    frequency: "monthly",
    ruleType: "fixed_date",
    fixedDate: 20,
    rollbackWeekend: true,
  };
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getActualPayday(month: number, year: number): Date {
  const config = getPaydayConfig();
  let date: Date;

  if (config.ruleType === "last_working_day") {
    date = new Date(year, month, 0);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 6) date.setDate(date.getDate() - 1);
    else if (dayOfWeek === 0) date.setDate(date.getDate() - 2);
  } else if (config.ruleType === "last_friday") {
    date = new Date(year, month, 0);
    const dayOfWeek = date.getDay();
    const daysToSubtract = (dayOfWeek + 2) % 7;
    date.setDate(date.getDate() - daysToSubtract);
  } else {
    const fixedDate = config.fixedDate ?? 20;
    const maxDays = new Date(year, month, 0).getDate();
    const actualDay = Math.min(fixedDate, maxDays);
    date = new Date(year, month - 1, actualDay);
    if (config.rollbackWeekend ?? true) {
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 6) date.setDate(date.getDate() - 1);
      else if (dayOfWeek === 0) date.setDate(date.getDate() - 2);
    }
  }
  return date;
}

function getIntervalCycle(referenceDate: Date, anchorDateStr: string, daysLength: number): { startDate: Date, endDate: Date } {
  let anchor = new Date();
  if (anchorDateStr) {
    anchor = parseDateString(anchorDateStr);
  }
  // Anchor must be at start of day
  anchor = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate());
  
  const ref = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  
  const msPerDay = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor((ref.getTime() - anchor.getTime()) / msPerDay);
  const cyclesElapsed = Math.floor(diffDays / daysLength);
  
  const startDate = new Date(anchor.getTime() + cyclesElapsed * daysLength * msPerDay);
  const endDate = new Date(startDate.getTime() + (daysLength - 1) * msPerDay);
  
  return { startDate, endDate };
}

export function getCurrentPaydayCycle(referenceDate: Date = new Date()): { startDate: Date, endDate: Date } {
  const config = getPaydayConfig();
  if (config.frequency === "weekly") {
    return getIntervalCycle(referenceDate, config.anchorDate || formatDateString(new Date()), 7);
  } else if (config.frequency === "bi_weekly") {
    return getIntervalCycle(referenceDate, config.anchorDate || formatDateString(new Date()), 14);
  }

  const refMonth = referenceDate.getMonth() + 1;
  const refYear = referenceDate.getFullYear();
  const currentMonthPayday = getActualPayday(refMonth, refYear);
  
  if (referenceDate < currentMonthPayday) {
    let prevMonth = refMonth - 1;
    let prevYear = refYear;
    if (prevMonth === 0) { prevMonth = 12; prevYear -= 1; }
    const startDate = getActualPayday(prevMonth, prevYear);
    const endDate = new Date(currentMonthPayday);
    endDate.setDate(endDate.getDate() - 1);
    return { startDate, endDate };
  } else {
    let nextMonth = refMonth + 1;
    let nextYear = refYear;
    if (nextMonth === 13) { nextMonth = 1; nextYear += 1; }
    const startDate = currentMonthPayday;
    const nextMonthPayday = getActualPayday(nextMonth, nextYear);
    const endDate = new Date(nextMonthPayday);
    endDate.setDate(endDate.getDate() - 1);
    return { startDate, endDate };
  }
}

export function getCycleBoundary(month: number, year: number): Date {
  const config = getPaydayConfig();
  let boundaryDay = 17;
  if (config.ruleType === "fixed_date") {
    const fixedDate = config.fixedDate ?? 20;
    boundaryDay = Math.max(1, fixedDate - 3);
  } else if (config.ruleType === "last_working_day") {
    boundaryDay = 25;
  } else if (config.ruleType === "last_friday") {
    boundaryDay = 22;
  }
  const maxDays = new Date(year, month, 0).getDate();
  const actualBoundaryDay = Math.min(boundaryDay, maxDays);
  return new Date(year, month - 1, actualBoundaryDay);
}

export function getDashboardCycle(referenceDate: Date = new Date()): { startDate: Date, endDate: Date } {
  const config = getPaydayConfig();
  if (config.frequency === "weekly") {
    return getIntervalCycle(referenceDate, config.anchorDate || formatDateString(new Date()), 7);
  } else if (config.frequency === "bi_weekly") {
    return getIntervalCycle(referenceDate, config.anchorDate || formatDateString(new Date()), 14);
  }

  const refMonth = referenceDate.getMonth() + 1;
  const refYear = referenceDate.getFullYear();
  const currentBoundary = getCycleBoundary(refMonth, refYear);

  if (referenceDate < currentBoundary) {
    let prevMonth = refMonth - 1;
    let prevYear = refYear;
    if (prevMonth === 0) { prevMonth = 12; prevYear -= 1; }
    const startDate = getCycleBoundary(prevMonth, prevYear);
    const endDate = new Date(currentBoundary);
    endDate.setDate(endDate.getDate() - 1);
    return { startDate, endDate };
  } else {
    let nextMonth = refMonth + 1;
    let nextYear = refYear;
    if (nextMonth === 13) { nextMonth = 1; nextYear += 1; }
    const startDate = currentBoundary;
    const nextBoundary = getCycleBoundary(nextMonth, nextYear);
    const endDate = new Date(nextBoundary);
    endDate.setDate(endDate.getDate() - 1);
    return { startDate, endDate };
  }
}

export function getNextPayday(referenceDate: Date = new Date()): Date {
  const config = getPaydayConfig();
  
  if (config.frequency === "weekly" || config.frequency === "bi_weekly") {
    const cycle = getCurrentPaydayCycle(referenceDate);
    if (formatDateString(referenceDate) === formatDateString(cycle.startDate)) {
      return cycle.startDate;
    }
    const next = new Date(cycle.endDate);
    next.setDate(next.getDate() + 1);
    return next;
  }
  
  const todayMidnight = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  let nextPayday = getActualPayday(referenceDate.getMonth() + 1, referenceDate.getFullYear());
  if (nextPayday <= todayMidnight && formatDateString(nextPayday) !== formatDateString(todayMidnight)) {
    let nm = referenceDate.getMonth() + 2;
    let ny = referenceDate.getFullYear();
    if (nm > 12) { nm = 1; ny += 1; }
    nextPayday = getActualPayday(nm, ny);
  }
  return nextPayday;
}

export function formatCycleLabel(startDate: Date, endDate: Date, frequency: PaydayFrequency): string {
  if (frequency === "monthly") {
    return `${MONTH_NAMES[startDate.getMonth()]} ${startDate.getFullYear().toString().substring(2)}`;
  }
  const sMonth = MONTH_NAMES[startDate.getMonth()];
  const sDay = String(startDate.getDate()).padStart(2, '0');
  const eMonth = MONTH_NAMES[endDate.getMonth()];
  const eDay = String(endDate.getDate()).padStart(2, '0');
  return `${sMonth} ${sDay} - ${eMonth} ${eDay}`;
}

export function formatCycleId(startDate: Date, frequency: PaydayFrequency): string {
  if (frequency === "monthly") {
    return `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  }
  return formatDateString(startDate);
}

export function getCurrentCycleId(referenceDate: Date = new Date()): string {
  const config = getPaydayConfig();
  const cycle = getDashboardCycle(referenceDate);
  return formatCycleId(cycle.startDate, config.frequency || "monthly");
}

export function getCycleForMonth(year: number, month: number): { startDate: Date, endDate: Date, label: string, id: string } {
  const startDate = getCycleBoundary(month, year);
  let nextMonth = month + 1;
  let nextYear = year;
  if (nextMonth === 13) { nextMonth = 1; nextYear += 1; }
  const nextBoundary = getCycleBoundary(nextMonth, nextYear);
  const endDate = new Date(nextBoundary);
  endDate.setDate(endDate.getDate() - 1);
  return {
    startDate,
    endDate,
    label: formatCycleLabel(startDate, endDate, "monthly"),
    id: formatCycleId(startDate, "monthly")
  };
}

export function getCycleFromId(id: string): { startDate: Date, endDate: Date, label: string, id: string } {
  const config = getPaydayConfig();
  const freq = config.frequency || "monthly";
  
  const monthMatch = id.match(/^(\d{4})-(\d{2})$/);
  if (monthMatch && freq === "monthly") {
    return getCycleForMonth(parseInt(monthMatch[1], 10), parseInt(monthMatch[2], 10));
  }
  
  const dayMatch = id.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dayMatch) {
    const cycle = getDashboardCycle(parseDateString(id));
    return { ...cycle, label: formatCycleLabel(cycle.startDate, cycle.endDate, freq), id: formatCycleId(cycle.startDate, freq) };
  }
  
  if (monthMatch) {
    const d = new Date(parseInt(monthMatch[1], 10), parseInt(monthMatch[2], 10) - 1, 15);
    const cycle = getDashboardCycle(d);
    return { ...cycle, label: formatCycleLabel(cycle.startDate, cycle.endDate, freq), id: formatCycleId(cycle.startDate, freq) };
  }
  throw new Error(`Invalid cycle ID: ${id}`);
}

export function getPastPaydayCycles(count: number = 6, referenceDate: Date = new Date()): { startDate: Date, endDate: Date, label: string, id: string }[] {
  const config = getPaydayConfig();
  const currentCycle = getDashboardCycle(referenceDate);
  const freq = config.frequency || "monthly";
  
  const cycles = [];
  if (freq === "monthly") {
    const currentMonth = currentCycle.startDate.getMonth() + 1;
    const currentYear = currentCycle.startDate.getFullYear();
    for (let i = 0; i < count; i++) {
      let refMonth = currentMonth - i;
      let refYear = currentYear;
      while (refMonth <= 0) { refMonth += 12; refYear -= 1; }
      cycles.push(getCycleForMonth(refYear, refMonth));
    }
  } else {
    const daysLength = freq === "weekly" ? 7 : 14;
    const msPerDay = 1000 * 60 * 60 * 24;
    for (let i = 0; i < count; i++) {
      const sd = new Date(currentCycle.startDate.getTime() - i * daysLength * msPerDay);
      const ed = new Date(sd.getTime() + (daysLength - 1) * msPerDay);
      cycles.push({ startDate: sd, endDate: ed, label: formatCycleLabel(sd, ed, freq), id: formatCycleId(sd, freq) });
    }
  }
  return cycles.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function getPastCyclesFrom(periodId: string, count: number = 12): { startDate: Date, endDate: Date, label: string, id: string }[] {
  const config = getPaydayConfig();
  const freq = config.frequency || "monthly";
  const startCycle = getCycleFromId(periodId);
  
  const cycles = [];
  if (freq === "monthly") {
    const month = startCycle.startDate.getMonth() + 1;
    const year = startCycle.startDate.getFullYear();
    for (let i = 0; i < count; i++) {
      let refMonth = month - i;
      let refYear = year;
      while (refMonth <= 0) { refMonth += 12; refYear -= 1; }
      cycles.push(getCycleForMonth(refYear, refMonth));
    }
  } else {
    const daysLength = freq === "weekly" ? 7 : 14;
    const msPerDay = 1000 * 60 * 60 * 24;
    for (let i = 0; i < count; i++) {
      const sd = new Date(startCycle.startDate.getTime() - i * daysLength * msPerDay);
      const ed = new Date(sd.getTime() + (daysLength - 1) * msPerDay);
      cycles.push({ startDate: sd, endDate: ed, label: formatCycleLabel(sd, ed, freq), id: formatCycleId(sd, freq) });
    }
  }
  return cycles.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
}

export function getAdjacentCycles(periodId: string): { prev: { label: string; id: string } | null; next: { label: string; id: string } | null; } {
  const config = getPaydayConfig();
  const freq = config.frequency || "monthly";
  const cycle = getCycleFromId(periodId);
  
  let prevCycle, nextCycle;
  if (freq === "monthly") {
    const month = cycle.startDate.getMonth() + 1;
    const year = cycle.startDate.getFullYear();
    let pM = month - 1, pY = year; if (pM === 0) { pM = 12; pY -= 1; }
    let nM = month + 1, nY = year; if (nM === 13) { nM = 1; nY += 1; }
    prevCycle = getCycleForMonth(pY, pM);
    nextCycle = getCycleForMonth(nY, nM);
  } else {
    const daysLength = freq === "weekly" ? 7 : 14;
    const msPerDay = 1000 * 60 * 60 * 24;
    const pSd = new Date(cycle.startDate.getTime() - daysLength * msPerDay);
    const nSd = new Date(cycle.startDate.getTime() + daysLength * msPerDay);
    
    prevCycle = {
      label: formatCycleLabel(pSd, new Date(pSd.getTime() + (daysLength - 1) * msPerDay), freq),
      id: formatCycleId(pSd, freq)
    };
    nextCycle = {
      label: formatCycleLabel(nSd, new Date(nSd.getTime() + (daysLength - 1) * msPerDay), freq),
      id: formatCycleId(nSd, freq)
    };
  }
  
  const currentCycle = getDashboardCycle(new Date());
  const isNextFuture = nextCycle.id > formatCycleId(currentCycle.startDate, freq);
  
  return {
    prev: { label: prevCycle.label, id: prevCycle.id },
    next: isNextFuture ? null : { label: nextCycle.label, id: nextCycle.id }
  };
}
