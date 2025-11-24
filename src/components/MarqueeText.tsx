import React, { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
    text: string;
    className?: string;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({ text, className = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (containerRef.current && textRef.current) {
                const isOverflow = textRef.current.scrollWidth > containerRef.current.clientWidth;
                setIsOverflowing(isOverflow);
            }
        };

        checkOverflow();
        window.addEventListener('resize', checkOverflow);
        return () => window.removeEventListener('resize', checkOverflow);
    }, [text]);

    return (
        <div
            ref={containerRef}
            className={`overflow-hidden whitespace-nowrap ${className}`}
            title={text}
        >
            <span
                ref={textRef}
                className={`inline-block ${isOverflowing ? 'animate-marquee' : ''}`}
            >
                {text}
            </span>
        </div>
    );
};
