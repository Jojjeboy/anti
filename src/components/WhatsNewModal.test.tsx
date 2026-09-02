import { render, screen, fireEvent } from '@testing-library/react';
import { WhatsNewModal } from './WhatsNewModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockDismiss = vi.fn();
let mockIsOpen = false;
let mockUnseenCommits: Array<{ hash: string; date: string; message: string }> = [];

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({ user: { uid: 'test-uid' } })
}));

vi.mock('../hooks/useChangelog', () => ({
    useChangelog: () => ({
        unseenCommits: mockUnseenCommits,
        isOpen: mockIsOpen,
        dismiss: mockDismiss,
    })
}));

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en' }
    }),
}));

vi.mock('lucide-react', () => ({
    X: () => <div data-testid="x-icon" />,
    Sparkles: () => <div data-testid="sparkles-icon" />
}));

describe('WhatsNewModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockIsOpen = false;
        mockUnseenCommits = [];
    });

    it('renders nothing when closed', () => {
        const { container } = render(<WhatsNewModal />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders title, commits and dismiss button when open', () => {
        mockIsOpen = true;
        mockUnseenCommits = [
            {
                hash: '123',
                date: '2026-09-02 06:20:36 +0200',
                message: 'feat: add dark mode toggle'
            }
        ];

        render(<WhatsNewModal />);

        expect(screen.getByText('whatsNew.title')).toBeDefined();
        expect(screen.getByText('whatsNew.subtitle')).toBeDefined();
        expect(screen.getByText('add dark mode toggle')).toBeDefined();
        expect(screen.getByText('whatsNew.dismiss')).toBeDefined();
    });

    it('calls dismiss when the Got it button is clicked', () => {
        mockIsOpen = true;
        mockUnseenCommits = [
            {
                hash: '123',
                date: '2026-09-02 06:20:36 +0200',
                message: 'feat: cool thing'
            }
        ];

        render(<WhatsNewModal />);
        fireEvent.click(screen.getByText('whatsNew.dismiss'));
        expect(mockDismiss).toHaveBeenCalledTimes(1);
    });

    it('calls dismiss when Escape is pressed', () => {
        mockIsOpen = true;
        render(<WhatsNewModal />);
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(mockDismiss).toHaveBeenCalledTimes(1);
    });
});
