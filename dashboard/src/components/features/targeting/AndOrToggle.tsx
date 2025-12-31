/**
 * AND/OR Toggle Component
 * 
 * Clickable button that toggles between AND and OR operators
 */

import React from 'react';
import { LogicalOperator } from '@/lib/types';

interface AndOrToggleProps {
    value: LogicalOperator;
    onChange: (value: LogicalOperator) => void;
    className?: string;
}

export function AndOrToggle({ value, onChange, className = '' }: AndOrToggleProps) {
    const handleClick = () => {
        onChange(value === 'AND' ? 'OR' : 'AND');
    };

    return (
        <div className={`flex justify-center my-3 ${className}`}>
            <button
                type="button"
                onClick={handleClick}
                className={`
                    px-6 py-2 rounded-md font-medium text-sm
                    transition-all duration-200
                    ${value === 'AND'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : 'bg-orange-500 hover:bg-orange-600 text-white'
                    }
                    shadow-sm hover:shadow-md
                    focus:outline-none focus:ring-2 focus:ring-offset-2
                    ${value === 'AND' ? 'focus:ring-blue-500' : 'focus:ring-orange-500'}
                `}
                title={`Click to change to ${value === 'AND' ? 'OR' : 'AND'}`}
            >
                {value}
                <span className="ml-2 text-xs opacity-75">(click to change to {value === 'AND' ? 'OR' : 'AND'})</span>
            </button>
        </div>
    );
}
