import { render, screen, act } from '@testing-library/react';
import { MarqueeText } from './MarqueeText';

describe('MarqueeText', () => {
    it('renders the text', () => {
        render(<MarqueeText text="Hello World" />);
        expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should not have marquee animation when text does not overflow', () => {
        render(<MarqueeText text="Short" />);
        const textElement = screen.getByText('Short');
        expect(textElement).not.toHaveClass('animate-marquee');
    });

    it('should have marquee animation when text overflows', () => {
        const longText = 'This is a very long text that should overflow the container';
        
        const { container } = render(<MarqueeText text={longText} />);
        
        const textElement = screen.getByText(longText);
        const containerElement = container.firstChild as HTMLElement;

        act(() => {
            // Mock the dimensions to simulate overflow
            Object.defineProperty(textElement, 'scrollWidth', { value: 200 });
            Object.defineProperty(containerElement, 'clientWidth', { value: 100 });
    
            // Re-trigger the effect
            window.dispatchEvent(new Event('resize'));
        });


        // Check if the class is applied
        expect(textElement).toHaveClass('animate-marquee');
    });
});
