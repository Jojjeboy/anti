import { describe, it, expect } from 'vitest';
import { toLocalISOString, getNextFullHour, formatGoogleCalendarTime, buildGoogleCalendarUrl } from './calendarUtils';

describe('calendarUtils', () => {
    describe('toLocalISOString', () => {
        it('formats a date as YYYY-MM-DDTHH:mm', () => {
            const testDate = new Date(2026, 8, 2, 14, 30); // local 2026-09-02 14:30
            const result = toLocalISOString(testDate);
            expect(result).toBe('2026-09-02T14:30');
        });
    });

    describe('getNextFullHour', () => {
        it('calculates the next full hour with 00 minutes and 00 seconds', () => {
            const fixedDate = new Date(2026, 8, 2, 14, 25, 30);
            const result = getNextFullHour(fixedDate);
            expect(result).toBe('2026-09-02T15:00');
        });
    });

    describe('formatGoogleCalendarTime', () => {
        it('converts an ISO string to Google Calendar UTC format', () => {
            const iso = '2026-09-02T14:00';
            const formatted = formatGoogleCalendarTime(iso);
            expect(formatted).toMatch(/^\d{8}T\d{6}Z$/);
        });
    });

    describe('buildGoogleCalendarUrl', () => {
        it('constructs a valid Google Calendar URL with title, items, and links', () => {
            const url = buildGoogleCalendarUrl({
                title: 'Matlista',
                items: [
                    { id: '1', text: 'Mjölk', completed: false },
                    { id: '2', text: 'Bröd', completed: true },
                ],
                listId: 'list-123',
                startTime: '2026-09-02T14:00',
                endTime: '2026-09-02T15:00',
                linkText: 'Öppna lista',
            });

            expect(url).toContain('https://calendar.google.com/calendar/render?action=TEMPLATE');
            expect(url).toContain('text=Matlista');
            expect(url).toContain(encodeURIComponent('• Mjölk\n• Bröd'));
            expect(url).toContain('list-123');
        });
    });
});
