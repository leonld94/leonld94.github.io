/**
 * Format a date string as Korean-style date.
 * @param {string} dateStr - ISO date string (e.g., '2026-02-20')
 * @returns {string} Formatted date (e.g., '2026년 2월 20일')
 */
export function formatDateKR(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr || '';
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}
