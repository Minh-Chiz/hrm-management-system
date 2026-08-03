/**
 * String, Currency, and Status Formatting Utility Layer
 */

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

/**
 * Formats a numeric amount or numeric string into VND currency format (e.g., "1.500.000 ₫").
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencySymbol: string = '₫'
): string {
  if (amount === null || amount === undefined || amount === '') return `0 ${currencySymbol}`.trim();
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericValue)) return `0 ${currencySymbol}`.trim();

  const formatted = new Intl.NumberFormat('vi-VN').format(numericValue);
  return `${formatted} ${currencySymbol}`.trim();
}

/**
 * Capitalizes the first letter of a string (e.g., "employee" -> "Employee").
 */
export function capitalize(str: string | null | undefined): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Capitalizes the first letter of each word in a string (e.g., "john doe" -> "John Doe").
 */
export function capitalizeWords(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => capitalize(word))
    .join(' ');
}

/**
 * Maps status string/enum values to human-readable label, text color, and background color.
 */
export function mapStatusEnum(status: string | null | undefined): StatusConfig {
  if (!status) {
    return { label: 'Không xác định', color: '#849396', bg: 'rgba(132, 147, 150, 0.15)' };
  }

  const normalized = status.trim();

  switch (normalized) {
    // Approval request statuses
    case 'pending':
    case 'PENDING':
    case 'Chờ duyệt':
    case 'Đang chờ duyệt':
      return { label: 'Chờ duyệt', color: '#e9c400', bg: 'rgba(233, 196, 0, 0.15)' };

    case 'approved':
    case 'APPROVED':
    case 'Đã duyệt':
      return { label: 'Đã duyệt', color: '#05e777', bg: 'rgba(5, 231, 119, 0.15)' };

    case 'rejected':
    case 'REJECTED':
    case 'Từ chối':
    case 'Đã từ chối':
      return { label: 'Đã từ chối', color: '#ffb4ab', bg: 'rgba(255, 180, 171, 0.15)' };

    // Employee account active statuses
    case 'Active':
    case 'ACTIVE':
    case 'Hoạt động':
      return { label: 'Hoạt động', color: '#05e777', bg: 'rgba(5, 231, 119, 0.12)' };

    case 'Inactive':
    case 'INACTIVE':
    case 'Tạm khóa':
      return { label: 'Tạm khóa', color: '#849396', bg: 'rgba(132, 147, 150, 0.12)' };

    // Task statuses
    case 'Cần làm':
    case 'neutral':
      return { label: 'Cần làm', color: '#849396', bg: 'rgba(186, 201, 204, 0.10)' };

    case 'Đang làm':
    case 'warning':
      return { label: 'Đang làm', color: '#f5cd00', bg: 'rgba(245, 205, 0, 0.15)' };

    case 'Chờ review':
    case 'Chờ test/review':
    case 'primary':
      return { label: 'Chờ review', color: '#00e5ff', bg: 'rgba(0, 229, 255, 0.12)' };

    case 'Hoàn thành':
    case 'completed':
    case 'success':
      return { label: 'Hoàn thành', color: '#05e777', bg: 'rgba(5, 231, 119, 0.12)' };

    case 'Trễ hạn':
    case 'LATE':
    case 'danger':
      return { label: 'Trễ hạn', color: '#ff5252', bg: 'rgba(255, 82, 82, 0.15)' };

    default:
      return { label: normalized, color: '#849396', bg: 'rgba(132, 147, 150, 0.15)' };
  }
}

/**
 * Extracts initials from a person's name (e.g., "Lê Hoàng Dương" -> "HD", "Trần A" -> "TA").
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[parts.length - 2][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
