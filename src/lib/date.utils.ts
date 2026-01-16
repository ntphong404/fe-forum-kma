/**
 * Utility functions for date/time handling
 */
import { type Locale } from 'date-fns';

/**
 * Parse LocalDateTime string from backend (ISO format without timezone)
 * Backend returns format like: "2025-12-30T17:34:54.423069972"
 * OR as array: [2025, 12, 30, 17, 34, 54, 423069972]
 * 
 * The backend returns LocalDateTime in UTC timezone.
 * We need to parse it as UTC and then it will be displayed in user's local timezone.
 * 
 * This function properly parses the date string or array.
 */
export function parseLocalDateTime(dateInput: string | number[] | undefined | null): Date | null {
    if (!dateInput) return null;

    try {
        // Handle array format from Java LocalDateTime serialization
        // Format: [year, month, day, hour, minute, second, nanoseconds?]
        if (Array.isArray(dateInput)) {
            const [year, month, day, hour = 0, minute = 0, second = 0] = dateInput;
            // month in Date is 0-indexed, but backend sends 1-indexed
            const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
            if (isNaN(date.getTime())) {
                return null;
            }
            return date;
        }

        // Handle string format
        const dateString = dateInput;

        // Remove nanoseconds if present (backend may return with nanoseconds)
        // "2025-12-30T17:34:54.423069972" -> "2025-12-30T17:34:54.423"
        let cleanedString = dateString;

        // If there's a decimal point, keep only 3 digits (milliseconds)
        const dotIndex = dateString.indexOf('.');
        if (dotIndex !== -1) {
            const beforeDot = dateString.substring(0, dotIndex);
            const afterDot = dateString.substring(dotIndex + 1);

            // Remove any timezone info (Z, +07:00, etc.) and keep only first 3 digits of fractional seconds
            const fractionalSeconds = afterDot.replace(/[Z\+\-].*$/, '').substring(0, 3);
            cleanedString = `${beforeDot}.${fractionalSeconds}`;
        }

        // If the string doesn't have 'Z' or timezone offset, it's from backend as UTC
        // Append 'Z' to treat it as UTC
        if (!cleanedString.includes('Z') && !cleanedString.match(/[+\-]\d{2}:\d{2}$/)) {
            cleanedString += 'Z';
        }

        const date = new Date(cleanedString);

        if (isNaN(date.getTime())) {
            return null;
        }

        return date;
    } catch {
        return null;
    }
}

/**
 * Format a date as relative time in Facebook style (e.g., "5 phút", "2 giờ", "3 ngày", "31 tháng 12")
 * Supports Date object, ISO string, or array format from Java LocalDateTime
 */
export function formatTimeAgo(date: Date | string | number[] | undefined | null, _locale?: Locale): string {
    // Parse the date - handle string, array, or Date object
    let parsedDate: Date | null;
    if (date instanceof Date) {
        parsedDate = date;
    } else {
        parsedDate = parseLocalDateTime(date as string | number[] | undefined | null);
    }

    if (!parsedDate || isNaN(parsedDate.getTime())) {
        return 'Vừa xong';
    }

    try {
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);

        // Less than 1 minute
        if (diffInSeconds < 60) {
            return 'Vừa xong';
        }

        // Less than 1 hour - show minutes
        const diffInMinutes = Math.floor(diffInSeconds / 60);
        if (diffInMinutes < 60) {
            return `${diffInMinutes} phút`;
        }

        // Less than 24 hours - show hours
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) {
            return `${diffInHours} giờ`;
        }

        // Less than 7 days - show days
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) {
            return `${diffInDays} ngày`;
        }

        // Less than 365 days - show "31 tháng 12" (day + month)
        if (diffInDays < 365) {
            const day = parsedDate.getDate();
            const month = parsedDate.getMonth() + 1;
            return `${day} tháng ${month}`;
        }

        // More than 365 days - show "31 tháng 12, 2024" (day + month + year)
        const day = parsedDate.getDate();
        const month = parsedDate.getMonth() + 1;
        const year = parsedDate.getFullYear();
        return `${day} tháng ${month}, ${year}`;
    } catch {
        return 'Vừa xong';
    }
}

