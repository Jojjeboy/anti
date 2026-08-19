import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import useLocalStorage from './useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        // Clear the mock store before each test
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('returns initialValue when localStorage is empty', () => {
        const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
        expect(result.current[0]).toBe('default');
    });

    it('returns stored value when key exists in localStorage', () => {
        window.localStorage.setItem('my-key', JSON.stringify('stored-value'));
        const { result } = renderHook(() => useLocalStorage('my-key', 'default'));
        expect(result.current[0]).toBe('stored-value');
    });

    it('persists the new value to localStorage when setValue is called', () => {
        const { result } = renderHook(() => useLocalStorage('count-key', 0));

        act(() => {
            result.current[1](42);
        });

        expect(result.current[0]).toBe(42);
        expect(window.localStorage.setItem).toHaveBeenCalledWith(
            'count-key',
            JSON.stringify(42)
        );
    });

    it('supports functional updater (value as function)', () => {
        window.localStorage.setItem('count-key', JSON.stringify(10));
        const { result } = renderHook(() => useLocalStorage('count-key', 0));

        act(() => {
            result.current[1]((prev) => prev + 5);
        });

        expect(result.current[0]).toBe(15);
    });

    it('returns initialValue when localStorage contains invalid JSON', () => {
        // Bypass the mock's JSON.parse and write raw invalid string
        vi.spyOn(window.localStorage, 'getItem').mockReturnValueOnce('not-valid-json{');

        const { result } = renderHook(() => useLocalStorage('broken-key', 'fallback'));
        expect(result.current[0]).toBe('fallback');
    });

    it('works with object values', () => {
        const obj = { name: 'LoopList', count: 3 };
        const { result } = renderHook(() =>
            useLocalStorage<typeof obj>('obj-key', { name: '', count: 0 })
        );

        act(() => {
            result.current[1](obj);
        });

        expect(result.current[0]).toEqual(obj);
    });
});
