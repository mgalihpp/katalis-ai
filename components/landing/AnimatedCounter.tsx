'use client';

import { useState, useEffect, useRef } from 'react';

// Counter animation hook
export function useCountUp(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible) return;

        let startTime: number;
        const animate = (currentTime: number) => {
            if (!startTime) startTime = currentTime;
            const progress = Math.min((currentTime - startTime) / duration, 1);
            setCount(Math.floor(progress * end));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, end, duration]);

    return { count, ref };
}

// Counter component
export function AnimatedCounter({ value, label }: { value: string; label: string }) {
    const numericMatch = value.match(/(\d+)/);
    const numericValue = numericMatch ? parseInt(numericMatch[1]) : 0;
    const suffix = value.replace(/\d+/, '');
    const { count, ref } = useCountUp(numericValue);

    return (
        <div
            ref={ref}
            className="group text-center py-4"
        >
            <p className="text-4xl sm:text-5xl md:text-6xl font-bold text-gradient-primary mb-2 group-hover:scale-110 transition-transform duration-300">
                {count}{suffix}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
                {label}
            </p>
        </div>
    );
}
