"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimerLayerProps {
    targetDate: string;
    style?: React.CSSProperties;
    className?: string;
    timerDisplay?: "Days" | "Hours" | "Minutes";
    boxColor?: string;
    labelColor?: string;
    padding?: number;
    minWidth?: number;
    gap?: number;
    borderRadius?: number;
}

export function TimerLayer({ targetDate, style, className, timerDisplay = "Days", boxColor = "#ffffff", labelColor = "#ffffff", padding = 8, minWidth = 48, gap = 16, borderRadius = 6 }: TimerLayerProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        isExpired: boolean;
    }>({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: false });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            let timeLeft = {
                days: 0,
                hours: 0,
                minutes: 0,
                seconds: 0,
                isExpired: false
            };

            if (difference > 0) {
                // Base calculations
                const totalSeconds = Math.floor(difference / 1000);
                const totalMinutes = Math.floor(totalSeconds / 60);
                const totalHours = Math.floor(totalMinutes / 60);
                const totalDays = Math.floor(totalHours / 24);

                if (timerDisplay === "Minutes") {
                    timeLeft = {
                        days: 0,
                        hours: 0,
                        minutes: totalMinutes,
                        seconds: totalSeconds % 60,
                        isExpired: false
                    };
                } else if (timerDisplay === "Hours") {
                    timeLeft = {
                        days: 0,
                        hours: totalHours,
                        minutes: totalMinutes % 60,
                        seconds: totalSeconds % 60,
                        isExpired: false
                    };
                } else {
                    // Default "Days"
                    timeLeft = {
                        days: totalDays,
                        hours: totalHours % 24,
                        minutes: totalMinutes % 60,
                        seconds: totalSeconds % 60,
                        isExpired: false
                    };
                }
            } else {
                timeLeft.isExpired = true;
            }

            return timeLeft;
        };

        setTimeLeft(calculateTimeLeft()); // Initial call

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    // Helper to pad single digits
    const pad = (num: number) => num.toString().padStart(2, "0");

    if (!targetDate) {
        return <div className="text-red-500 text-sm">Set Date</div>;
    }

    // We inherit most styles from the parent container via `style` prop passed to container usually,
    // but here we might want to apply some specific internal layout styles.
    // However, the parent `LayerComponent` applies `style` to the wrapper div.
    // The `style` prop passed here might contain font styles that we want to cascade.

    // Style match to reference image:
    // White boxes for numbers, dark text inside boxes.
    // Labels below boxes.
    // No separators (colons).
    return (
        <div
            className={cn("flex items-center justify-center", className)}
            style={{
                gap: `${gap}px`,
                fontFamily: style?.fontFamily,
            }}
        >
            {timerDisplay === "Days" && <TimerUnit value={timeLeft.days} label="Days" boxColor={boxColor} labelColor={labelColor} numberColor={style?.color} fontSize={style?.fontSize} fontWeight={style?.fontWeight} padding={padding} minWidth={minWidth} borderRadius={borderRadius} />}
            {(timerDisplay === "Days" || timerDisplay === "Hours") && <TimerUnit value={timeLeft.hours} label="Hours" boxColor={boxColor} labelColor={labelColor} numberColor={style?.color} fontSize={style?.fontSize} fontWeight={style?.fontWeight} padding={padding} minWidth={minWidth} borderRadius={borderRadius} />}
            <TimerUnit value={timeLeft.minutes} label="Minutes" boxColor={boxColor} labelColor={labelColor} numberColor={style?.color} fontSize={style?.fontSize} fontWeight={style?.fontWeight} padding={padding} minWidth={minWidth} borderRadius={borderRadius} />
            <TimerUnit value={timeLeft.seconds} label="Seconds" boxColor={boxColor} labelColor={labelColor} numberColor={style?.color} fontSize={style?.fontSize} fontWeight={style?.fontWeight} padding={padding} minWidth={minWidth} borderRadius={borderRadius} />
        </div>
    );
}

function TimerUnit({ value, label, boxColor, labelColor, numberColor, fontSize, fontWeight, padding, minWidth, borderRadius }: {
    value: number;
    label: string;
    boxColor?: string;
    labelColor?: string;
    numberColor?: string;
    fontSize?: string | number;
    fontWeight?: string | number;
    padding?: number;
    minWidth?: number;
    borderRadius?: number;
}) {
    // Determine if we should show days. 
    // If value is 0, maybe hide? The reference image shows H:M:S. 
    // I'll keep D:H:M:S for now as standard behavior.

    return (
        <div className="flex flex-col items-center">
            <div
                className="text-center shadow-sm"
                style={{
                    backgroundColor: boxColor || "#ffffff",
                    color: numberColor || "#111827",
                    padding: `${padding}px`,
                    minWidth: `${minWidth}px`,
                    borderRadius: `${borderRadius}px`,
                }}
            >
                <span
                    className="leading-none block"
                    style={{
                        fontSize: fontSize || "1.5rem", // Default 2xl essentially
                        fontWeight: fontWeight || 700,
                    }}
                >
                    {value.toString().padStart(2, "0")}
                </span>
            </div>
            <span
                className="text-[10px] font-medium uppercase mt-1 tracking-wider shadow-black/20 text-shadow-sm"
                style={{ color: labelColor || "#ffffff" }}
            >
                {label}
            </span>
        </div>
    );
}
