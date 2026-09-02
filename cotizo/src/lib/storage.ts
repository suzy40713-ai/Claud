import type { ActivityType } from "./rates";

const STORAGE_KEY = "cotizo:data:v1";

export interface MonthEntry {
  month: string; // format "2026-09"
  chiffreAffaires: number;
}

export interface CotizoData {
  activity: ActivityType | null;
  versementLiberatoire: boolean;
  entries: MonthEntry[];
}

const DEFAULT_DATA: CotizoData = {
  activity: null,
  versementLiberatoire: false,
  entries: [],
};

export function loadData(): CotizoData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATA;
    return { ...DEFAULT_DATA, ...JSON.parse(raw) } as CotizoData;
  } catch {
    return DEFAULT_DATA;
  }
}

export function saveData(data: CotizoData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function currentYear(): number {
  return new Date().getFullYear();
}

export function yearTotal(entries: MonthEntry[], year: number): number {
  return entries.filter((e) => e.month.startsWith(String(year))).reduce((sum, e) => sum + e.chiffreAffaires, 0);
}
