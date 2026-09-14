import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDoctorName(name: string): string {
  if (!name) return name;
  const lowerName = name.trim().toLowerCase();
  if (
    lowerName.startsWith('dr.') ||
    lowerName.startsWith('dr ') ||
    lowerName.startsWith('doctor ')
  ) {
    return name.trim();
  }
  return `Dr. ${name.trim()}`;
}
