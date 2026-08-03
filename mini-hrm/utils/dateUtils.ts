/**
 * Date Formatting Utility Layer
 */

/**
 * Formats a Date object, ISO date string, or timestamp into a standard date string (e.g., "DD/MM/YYYY").
 */
export function formatToDateString(
  date: Date | string | number | null | undefined,
  separator: string = '/'
): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    // If it's already a date string like "YYYY-MM-DD" or similar
    if (typeof date === 'string' && date.includes('-')) {
      const parts = date.split('-');
      if (parts.length === 3) {
        return `${parts[2]}${separator}${parts[1]}${separator}${parts[0]}`;
      }
    }
    return String(date);
  }

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}${separator}${month}${separator}${year}`;
}

/**
 * Formats a Date object, ISO date string, or timestamp into a time string (e.g., "HH:mm" or "HH:mm:ss").
 */
export function formatToTimeString(
  date: Date | string | number | null | undefined,
  includeSeconds: boolean = false
): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  if (includeSeconds) {
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  return `${hours}:${minutes}`;
}

/**
 * Formats a date string like "YYYY-MM-DD" into a compact "DD/MM" format.
 */
export function formatDateCompact(dateStr?: string | null): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
}

/**
 * Returns a human-readable relative time string in Vietnamese (e.g., "Vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước").
 */
export function getRelativeTime(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (isNaN(d.getTime())) return String(date);

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Vừa xong';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ngày trước`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} tháng trước`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} năm trước`;
}

/**
 * Formats a Date object, ISO date string, or timestamp into a combined date-time string (e.g., "14:30 - 25/12/2026").
 */
export function formatDateTime(
  date: Date | string | number | null | undefined,
  separator: string = '/'
): string {
  if (!date) return '';
  const timeStr = formatToTimeString(date);
  const dateStr = formatToDateString(date, separator);
  if (!timeStr || !dateStr) return String(date);
  return `${timeStr} - ${dateStr}`;
}
