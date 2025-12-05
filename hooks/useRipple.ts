'use client';

import { useCallback } from 'react';

export function useRipple() {
    const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
        const element = event.currentTarget;
        const rect = element.getBoundingClientRect();

        // Calculate ripple size (should cover the entire element)
        const size = Math.max(rect.width, rect.height) * 2;

        // Calculate click position relative to element
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        // Create ripple element
        const ripple = document.createElement('span');
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: currentColor;
            opacity: 0.15;
            border-radius: 50%;
            transform: scale(0);
            animation: ripple-animation 0.6s ease-out forwards;
            pointer-events: none;
        `;

        // Ensure parent has relative positioning and overflow hidden
        const computedStyle = window.getComputedStyle(element);
        if (computedStyle.position === 'static') {
            element.style.position = 'relative';
        }
        element.style.overflow = 'hidden';

        element.appendChild(ripple);

        // Remove ripple after animation
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }, []);

    return { createRipple };
}

// Export a simple event handler for inline use
export function createRippleEffect(event: React.MouseEvent<HTMLElement>) {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();

    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: currentColor;
        opacity: 0.2;
        border-radius: 50%;
        transform: scale(0);
        animation: ripple-animation 0.5s ease-out forwards;
        pointer-events: none;
    `;

    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.position === 'static') {
        element.style.position = 'relative';
    }
    element.style.overflow = 'hidden';

    element.appendChild(ripple);

    ripple.addEventListener('animationend', () => {
        ripple.remove();
    });
}
