import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest';
import { useChangelog } from './useChangelog';
import { getDoc, setDoc } from 'firebase/firestore';

vi.mock('../firebase', () => ({
    db: {},
}));

vi.mock('../commits.json', () => ({
    default: [
        {
            hash: 'hash-newest',
            date: '2026-09-02 06:20:36 +0200',
            message: 'feat: add awesome feature'
        },
        {
            hash: 'hash-noise',
            date: '2026-09-02 06:10:55 +0200',
            message: 'mc'
        },
        {
            hash: 'hash-middle',
            date: '2026-09-01 09:07:03 +0200',
            message: 'fix: fix annoying bug'
        },
        {
            hash: 'hash-oldest',
            date: '2026-08-19 17:43:32 +0200',
            message: 'chore: initial commit'
        }
    ]
}));

describe('useChangelog', () => {
    const mockUserId = 'user-123';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should do nothing when userId is not provided', () => {
        const { result } = renderHook(() => useChangelog(null));
        expect(result.current.isOpen).toBe(false);
        expect(result.current.unseenCommits).toEqual([]);
        expect(getDoc).not.toHaveBeenCalled();
    });

    it('should silently set lastSeenCommitHash and not open modal on first visit (snap.exists() = false)', async () => {
        (getDoc as Mock).mockResolvedValueOnce({
            exists: () => false
        });

        const { result } = renderHook(() => useChangelog(mockUserId));

        await waitFor(() => {
            expect(getDoc).toHaveBeenCalled();
        });

        expect(setDoc).toHaveBeenCalledWith(
            expect.anything(),
            { lastSeenCommitHash: 'hash-newest' }
        );
        expect(result.current.isOpen).toBe(false);
        expect(result.current.unseenCommits).toEqual([]);
    });

    it('should open modal and filter out noise commits if there are unseen commits', async () => {
        (getDoc as Mock).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ lastSeenCommitHash: 'hash-middle' })
        });

        const { result } = renderHook(() => useChangelog(mockUserId));

        await waitFor(() => {
            expect(result.current.isOpen).toBe(true);
        });

        // hash-noise ('mc') is filtered out, so only 'hash-newest' should be in unseenCommits
        expect(result.current.unseenCommits).toHaveLength(1);
        expect(result.current.unseenCommits[0].hash).toBe('hash-newest');
    });

    it('should not open modal if user has already seen the newest commit', async () => {
        (getDoc as Mock).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ lastSeenCommitHash: 'hash-newest' })
        });

        const { result } = renderHook(() => useChangelog(mockUserId));

        await waitFor(() => {
            expect(getDoc).toHaveBeenCalled();
        });

        expect(result.current.isOpen).toBe(false);
        expect(result.current.unseenCommits).toEqual([]);
    });

    it('should update Firestore with newest hash and close modal when dismissed', async () => {
        (getDoc as Mock).mockResolvedValueOnce({
            exists: () => true,
            data: () => ({ lastSeenCommitHash: 'hash-oldest' })
        });

        const { result } = renderHook(() => useChangelog(mockUserId));

        await waitFor(() => {
            expect(result.current.isOpen).toBe(true);
        });

        await act(async () => {
            await result.current.dismiss();
        });

        expect(result.current.isOpen).toBe(false);
        expect(setDoc).toHaveBeenCalledWith(
            expect.anything(),
            { lastSeenCommitHash: 'hash-newest' }
        );
    });
});
