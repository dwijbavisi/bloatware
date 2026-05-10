const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

/**
 * Format a date string for display.
 * - "YYYY-MM-DD" → "Month DD, YYYY"  (e.g. "May 10, 2026")
 * - "YYYY-MM"    → "Month YYYY"      (e.g. "May 2026")
 * - anything else → returned as-is
 */
export function formatDate(date: string): string {
    const fullMatch = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (fullMatch) {
        const month = MONTHS[parseInt(fullMatch[2], 10) - 1];
        const day = parseInt(fullMatch[3], 10);
        return `${month} ${day}, ${fullMatch[1]}`;
    }

    const monthMatch = date.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
        const month = MONTHS[parseInt(monthMatch[2], 10) - 1];
        return `${month} ${monthMatch[1]}`;
    }

    return date;
}
