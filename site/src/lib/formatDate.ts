const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

/**
 * Formats a raw ISO date string for user-facing display.
 * Transforms strict sorting dates into human-readable strings.
 *
 * - "YYYY-MM-DD" -> "Month DD, YYYY" (e.g., "May 10, 2026")
 * - "YYYY-MM"    -> "Month YYYY" (e.g., "May 2026")
 * - Any other format is returned unmodified.
 *
 * @param date - The raw date string to format.
 * @returns The formatted date string.
 * @example
 * formatDate("2026-05-10") // Returns "May 10, 2026"
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
