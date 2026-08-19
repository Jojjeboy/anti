import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMigrateLocalStorage } from './useMigrateLocalStorage';
import * as firestoreModule from 'firebase/firestore';

// Provide i18n mock
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (key: string) => key }),
}));

// Toast mock
const mockShowToast = vi.fn();
vi.mock('../context/ToastContext', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

describe('useMigrateLocalStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
    });

    it('does nothing when userId is null', async () => {
        const { result } = renderHook(() => useMigrateLocalStorage(null));

        await waitFor(() => expect(result.current.migrating).toBe(false));
        expect(firestoreModule.getDocs).not.toHaveBeenCalled();
    });

    it('does nothing when userId is undefined', async () => {
        const { result } = renderHook(() => useMigrateLocalStorage(undefined));

        await waitFor(() => expect(result.current.migrating).toBe(false));
        expect(firestoreModule.getDocs).not.toHaveBeenCalled();
    });

    it('skips migration when Firestore already has categories', async () => {
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            empty: false,
            forEach: vi.fn(),
        } as unknown as ReturnType<typeof firestoreModule.getDocs>);

        window.localStorage.setItem('categories', JSON.stringify([{ id: 'c1', name: 'Work' }]));

        const { result } = renderHook(() => useMigrateLocalStorage('user-123'));

        await waitFor(() => expect(result.current.migrating).toBe(false));
        expect(firestoreModule.writeBatch).not.toHaveBeenCalled();
    });

    it('skips migration when localStorage has no relevant keys', async () => {
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            empty: true,
            forEach: vi.fn(),
        } as unknown as ReturnType<typeof firestoreModule.getDocs>);

        const { result } = renderHook(() => useMigrateLocalStorage('user-456'));

        await waitFor(() => expect(result.current.migrating).toBe(false));
        expect(firestoreModule.writeBatch).not.toHaveBeenCalled();
    });

    it('runs migration, commits batch, clears localStorage on success', async () => {
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            empty: true,
            forEach: vi.fn(),
        } as unknown as ReturnType<typeof firestoreModule.getDocs>);

        const mockBatch = {
            set: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            commit: vi.fn().mockResolvedValue(undefined),
        };
        vi.mocked(firestoreModule.writeBatch).mockReturnValueOnce(
            mockBatch as unknown as ReturnType<typeof firestoreModule.writeBatch>
        );

        window.localStorage.setItem(
            'categories',
            JSON.stringify([{ id: 'cat1', name: 'Work', order: 0 }])
        );
        window.localStorage.setItem(
            'lists',
            JSON.stringify([{ id: 'list1', name: 'Gym', categoryId: 'cat1', items: [] }])
        );

        const { result } = renderHook(() => useMigrateLocalStorage('user-789'));

        await waitFor(() => expect(result.current.migrating).toBe(false));

        expect(mockBatch.commit).toHaveBeenCalled();
        expect(mockShowToast).toHaveBeenCalledWith('toasts.dataMigrated', 'success');
        expect(window.localStorage.getItem('categories')).toBeNull();
        expect(window.localStorage.getItem('lists')).toBeNull();
    });

    it('shows error toast and stays migrating=false on Firestore failure', async () => {
        vi.mocked(firestoreModule.getDocs).mockResolvedValueOnce({
            empty: true,
            forEach: vi.fn(),
        } as unknown as ReturnType<typeof firestoreModule.getDocs>);

        const mockBatch = {
            set: vi.fn(),
            commit: vi.fn().mockRejectedValue(new Error('Firestore write failed')),
        };
        vi.mocked(firestoreModule.writeBatch).mockReturnValueOnce(
            mockBatch as unknown as ReturnType<typeof firestoreModule.writeBatch>
        );

        window.localStorage.setItem('categories', JSON.stringify([{ id: 'c1', name: 'X' }]));

        const { result } = renderHook(() => useMigrateLocalStorage('user-err'));

        await waitFor(() => expect(result.current.migrating).toBe(false));
        expect(mockShowToast).toHaveBeenCalledWith('toasts.migrationFailed', 'error');
    });
});
