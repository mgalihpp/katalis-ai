"use client";

import { useState, useEffect, ChangeEvent } from "react";
import { cn } from "@/lib/utils";

interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
    prefix?: string;
}

export function CurrencyInput({
    value,
    onChange,
    placeholder = "0",
    className,
    prefix = "Rp"
}: CurrencyInputProps) {
    const [displayValue, setDisplayValue] = useState("");

    // Format number with dots
    const formatNumber = (num: number): string => {
        if (num === 0) return "";
        return num.toLocaleString("id-ID");
    };

    // Parse formatted string back to number
    const parseNumber = (str: string): number => {
        // Remove all non-digit characters
        const cleaned = str.replace(/\D/g, "");
        return cleaned ? parseInt(cleaned, 10) : 0;
    };

    // Update display value when prop value changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDisplayValue(formatNumber(value));
    }, [value]);

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const numericValue = parseNumber(inputValue);

        // Update display with formatted value
        setDisplayValue(formatNumber(numericValue));

        // Call onChange with numeric value
        onChange(numericValue);
    };

    return (
        <div className="relative">
            {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    {prefix}
                </span>
            )}
            <input
                type="text"
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                placeholder={placeholder}
                className={cn(
                    "flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    prefix && "pl-10",
                    className
                )}
            />
        </div>
    );
}
